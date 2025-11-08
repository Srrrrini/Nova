from __future__ import annotations

import json
import time
import textwrap
from typing import Any, List

from pydantic import ValidationError

from ..schemas import MeetingContext, Milestone, PlanningPlan, TaskAssignment
from .github_search import GitHubCodeSearcher
from .openrouter_client import OpenRouterClient, OpenRouterError


class OpenRouterPlanningPipeline:
    """
    Generates a sprint plan by orchestrating six sequential OpenRouter prompts.
    """

    def __init__(self, client: OpenRouterClient, searcher: GitHubCodeSearcher | None = None) -> None:
        self._client = client
        self._searcher = searcher or GitHubCodeSearcher()

    def generate_plan(self, context: MeetingContext) -> PlanningPlan:
        combined_prompt = self._build_combined_prompt(context)
        plan_json = self._call_text(
            combined_prompt,
            temperature=0.3,
            max_tokens=2000,
            step="combined_plan",
        )
        plan = self._parse_plan(plan_json)
        return plan

    # --- Prompt steps ----------------------------------------------------- #

    def _build_combined_prompt(self, context: MeetingContext) -> str:
        transcript_excerpt = context.transcript[:4000]
        repository_context = self._gather_repository_context(context, transcript_excerpt)
        return textwrap.dedent(
            f"""
            You are an expert sprint planner. Given the following meeting context, produce a JSON object that follows exactly this schema:

            {{
              "summary": string,   // concise paragraph summarising goals, constraints, decisions
              "risks": [string, ...], // at least two concrete risks or open questions with mitigation ideas
              "milestones": [
                {{
                  "title": string,
                  "dueDate": string | null,  // ISO date if specified, otherwise null
                  "tasks": [
                    {{
                      "title": string,
                      "owner": string | null,   // participant responsible or null
                      "areas": [string, ...],   // relevant repository files/directories/issues
                      "etaDays": integer | null,
                      "notes": string | null
                    }}
                  ]
                }}
              ]
            }}

            Requirements:
            - Produce valid JSON only. No markdown, no comments.
            - "summary" must be non-empty, reflecting project goals, key workstreams, and constraints.
            - Provide at least three risks; infer risks from the transcript and issues if not explicit.
            - Generate at least three milestones covering discovery, implementation, QA/deployment/documentation.
            - Each milestone must contain at least two tasks. Tasks must map to code areas using the repository context.
            - Prefer the participant most suited to own each task (use their role as a hint).
            - Use null only when the information cannot be inferred.

            Project:
            - Name: {context.project.name}
            - Goal: {context.project.goal or 'Unknown'}
            - Repository URL: {context.project.repositoryUrl or 'Unknown'}

            Participants:
            {self._format_participants(context)}

            Known issues:
            {self._format_issues(context)}

            Repository signals:
            {repository_context}

            Meeting transcript excerpt:
            \"\"\"{transcript_excerpt}\"\"\"
            """
        )

    # --- Helpers ---------------------------------------------------------- #

    def _call_text(
        self,
        prompt: str,
        *,
        temperature: float = 0.7,
        max_tokens: int = 600,
        step: str,
    ) -> str:
        messages = [
            {"role": "system", "content": "You are a meticulous sprint-planning assistant."},
            {"role": "user", "content": prompt},
        ]
        attempts = 0
        result: str = ""
        max_attempts = 3
        while attempts < max_attempts:
            attempts += 1
            result = self._client.complete(messages, temperature=temperature, max_tokens=max_tokens).strip()
            if result:
                break
            print(f"[openrouter:{step}] empty response on attempt {attempts}, retrying...")
            time.sleep(min(2, attempts))
        if not result:
            raise OpenRouterError(f"OpenRouter returned an empty response after {attempts} attempts.")
        print(f"[openrouter:{step}] {result}")
        return result

    def _parse_plan(self, plan_json: str) -> PlanningPlan:
        try:
            return PlanningPlan.model_validate_json(plan_json)
        except ValidationError:
            repaired = self._repair_json(plan_json)
            return PlanningPlan.model_validate_json(repaired)

    def _repair_json(self, payload: str) -> str:
        prompt = textwrap.dedent(
            f"""
            The following text was supposed to be valid JSON but failed validation.
            Return a corrected JSON document that complies with the schema described earlier.
            Only output JSON.

            Problematic payload:
            {payload}
            """
        )
        messages = [
            {"role": "system", "content": "You fix JSON documents so that they are valid and schema-compliant."},
            {"role": "user", "content": prompt},
        ]
        fixed = self._client.complete(messages, temperature=0.0, max_tokens=1800).strip()
        # Ensure the result parses as JSON before returning it further.
        json.loads(fixed)
        return fixed

    def _format_participants(self, context: MeetingContext) -> str:
        return "\n".join(f"- {p.name} ({p.role})" for p in context.participants) or "No participants provided."

    def _format_issues(self, context: MeetingContext) -> str:
        if not context.issues:
            return "No explicit issues were referenced."
        return "\n".join(
            f"- {issue.title} ({issue.url or issue.id or 'no link'})"
            for issue in context.issues
        )

    def _gather_repository_context(self, context: MeetingContext, action_items: str) -> str:
        if not self._searcher:
            return "No repository lookup performed."
        repository_url = str(context.project.repositoryUrl) if context.project.repositoryUrl else None
        return self._searcher.gather_context(
            repository_url,
            action_items,
        )

    def _ensure_plan_completeness(
        self,
        plan: PlanningPlan,
        *,
        summary_text: str,
        risks_text: str,
        action_items_text: str,
        code_mapping_text: str,
    ) -> PlanningPlan:
        updates: dict[str, Any] = {}

        cleaned_summary = summary_text.strip()
        if not plan.summary and cleaned_summary:
            updates["summary"] = cleaned_summary.replace("\n", " ")

        if not plan.risks:
            updates["risks"] = self._extract_list_from_text(risks_text, default_fallback=["Risk not specified"])

        if not plan.milestones:
            tasks = self._tasks_from_action_items(action_items_text, code_mapping_text)
            updates["milestones"] = [
                Milestone(
                    title="Sprint Execution",
                    tasks=tasks or [
                        TaskAssignment(
                            title="Review meeting notes and define concrete tasks",
                            owner=None,
                            areas=[],
                            etaDays=None,
                            notes="Fallback generated because OpenRouter response was incomplete.",
                        )
                    ],
                )
            ]

        if not updates:
            return plan

        return plan.model_copy(update=updates)

    def _extract_list_from_text(self, text: str, default_fallback: List[str]) -> List[str]:
        lines = [line.strip(" -•1234567890.") for line in text.splitlines() if line.strip()]
        deduped = [line for line in lines if line]
        return deduped or default_fallback

    def _tasks_from_action_items(self, action_items_text: str, code_mapping_text: str) -> List[TaskAssignment]:
        tasks: List[TaskAssignment] = []
        code_lines = [line.strip() for line in code_mapping_text.splitlines() if line.strip()]
        for raw_line in action_items_text.splitlines():
            line = raw_line.strip(" -•")
            if not line:
                continue
            owner = None
            title = line
            if "(Owner:" in line:
                title_part, _, owner_part = line.partition("(Owner:")
                title = title_part.strip()
                owner = owner_part.rstrip(")").strip()
                if owner.lower() == "tbd":
                    owner = None
            related_areas = [
                entry.split("→", 1)[-1].strip()
                for entry in code_lines
                if entry.lower().startswith(f"- `{title.lower().split()[0]}")
            ]
            tasks.append(
                TaskAssignment(
                    title=title,
                    owner=owner,
                    areas=related_areas,
                    etaDays=None,
                    notes=None,
                )
            )
        return tasks

    def _fallback_risks(self, summary: str) -> str:
        lower_summary = summary.lower()
        risks = []
        if "session" in lower_summary or "auth" in lower_summary:
            risks.append(
                "Authentication/session refactor may introduce regressions without thorough automated and manual testing; ensure test coverage before release."
            )
        if "documentation" in lower_summary or "doc" in lower_summary:
            risks.append(
                "Documentation updates could lag behind code changes, leading to integrator confusion; schedule reviews with tech writers before release."
            )
        if "deployment" in lower_summary or "ci" in lower_summary:
            risks.append(
                "Deployment workflow changes might break existing pipelines; test container-based deploys in staging and provide rollback steps."
            )
        if "release" in lower_summary:
            risks.append(
                "Release timeline may slip if critical bugs appear late; maintain a buffer and communicate status to stakeholders."
            )
        if not risks:
            risks = [
                "Unspecified technical debt may surface during sprint execution; monitor velocity and adjust scope as needed.",
                "Team availability or external dependencies could delay completion; track risks during stand-ups.",
            ]
        return "\n".join(f"{idx+1}. {text}" for idx, text in enumerate(risks))


