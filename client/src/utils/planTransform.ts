import type { MeetingSummary } from '../types/meeting';
import type { TaskNode } from '../types/project';
import type { MeetingContextPayload, PlanningResponse, PlanningPlan, PlanningMilestone, PlanningTask } from '../types/plan';

const DEFAULT_HOURS_PER_DAY = 6;
const DEFAULT_RATE = 120;

export function planResponseToMeeting(
  response: PlanningResponse,
  context: MeetingContextPayload
): MeetingSummary {
  if (response.status !== 'ready' || !response.plan) {
    throw new Error(response.error || 'Planning failed');
  }

  const plan = normalizePlan(response.plan);
  const tasks = convertTasks(response.meetingId, plan);
  const totalHours = tasks.reduce((sum, task) => sum + task.hours, 0);
  const totalCost = totalHours * DEFAULT_RATE;

  const attendees = context.participants.map((participant) => participant.name);
  const transcript = response.transcript ?? context.transcript ?? '';
  const resources = Array.from(
    new Set<string>(
      plan.milestones.flatMap((milestone) =>
        milestone.tasks.flatMap((task) => task.areas ?? [])
      )
    )
  );

  return {
    id: response.meetingId,
    title: context.project.name,
    date: new Date().toLocaleDateString('en-US'),
    attendees,
    summary: plan.summary ?? 'No summary provided.',
    minutes: formatMinutes(plan),
    tasks,
    resources,
    hours: totalHours,
    cost: totalCost,
    transcript: transcript || undefined,
    prompt: response.prompt ?? undefined
  };
}

function normalizePlan(plan: PlanningPlan): PlanningPlan {
  const summary = plan.summary ?? 'Planning summary unavailable.';
  const risks = plan.risks.length ? plan.risks : ['Risks not specified.'];
  const milestones = plan.milestones.length
    ? plan.milestones
    : [
        {
          title: 'Initial Planning',
          dueDate: null,
          tasks: [
            {
              title: 'Review audio transcript and extract action items',
              owner: null,
              areas: [],
              etaDays: 2,
              notes: 'Generated fallback task because planner did not return milestones.'
            }
          ]
        }
      ];

  return { summary, risks, milestones };
}

function convertTasks(meetingId: string, plan: PlanningPlan): TaskNode[] {
  const risks = plan.risks;
  const defaultRisk = risks[0] || 'Unspecified risk';

  // First pass: create all tasks and build a title-to-id map
  const titleToIdMap = new Map<string, string>();
  const tasks: TaskNode[] = [];
  
  plan.milestones.forEach((milestone, milestoneIndex) => {
    milestone.tasks.forEach((task, taskIndex) => {
      const id = `${meetingId}-task-${milestoneIndex}-${taskIndex}`;
      titleToIdMap.set(task.title, id);
      
      const hours = Math.max(
        2,
        Math.round((task.etaDays ?? 1) * DEFAULT_HOURS_PER_DAY)
      );
      
      tasks.push({
        id,
        name: task.title,
        description: task.notes || milestone.title,
        owner: task.owner || 'Unassigned',
        depends_on: [], // Will be filled in second pass
        hours,
        risk: risks[taskIndex % risks.length] || defaultRisk,
        status: 'pending'
      });
    });
  });

  // Second pass: resolve dependencies using the title-to-id map
  let taskIndex = 0;
  plan.milestones.forEach((milestone) => {
    milestone.tasks.forEach((task) => {
      if (task.dependsOn && task.dependsOn.length > 0) {
        const resolvedDeps = task.dependsOn
          .map((depTitle) => titleToIdMap.get(depTitle))
          .filter((depId): depId is string => depId !== undefined);
        tasks[taskIndex].depends_on = resolvedDeps;
      }
      taskIndex++;
    });
  });

  return tasks;
}

function formatMinutes(plan: PlanningPlan): string {
  const milestoneLines = plan.milestones.map((milestone) => {
    const tasks = milestone.tasks.map((task) => `• ${task.title}`).join('\n');
    return `${milestone.title}\n${tasks}`;
  });

  return [plan.summary ?? '', '', ...milestoneLines].join('\n').trim();
}

