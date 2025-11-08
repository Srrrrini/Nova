from pathlib import Path
import json
import logging

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, UploadFile, File, Form, status
from pydantic import ValidationError

from .repository import PlanningRepository
from .schemas import MeetingContext, PlanningResponse
from .services.openrouter_client import OpenRouterClient
from .services.openrouter_pipeline import OpenRouterPlanningPipeline
from .services.planning import PlanningService
from .services.transcription import transcribe_upload


def get_repository() -> PlanningRepository:
    return _repository


def get_openrouter_pipeline() -> OpenRouterPlanningPipeline:
    return _pipeline


def get_planning_service(
    repository: PlanningRepository = Depends(get_repository),
    pipeline: OpenRouterPlanningPipeline = Depends(get_openrouter_pipeline),
) -> PlanningService:
    return PlanningService(repository=repository, pipeline=pipeline)


load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env", override=False)

_repository = PlanningRepository()
_openrouter_client = OpenRouterClient()
_pipeline = OpenRouterPlanningPipeline(client=_openrouter_client)
logger = logging.getLogger("nova.app")
logging.basicConfig(level=logging.INFO)

def create_app() -> FastAPI:
    app = FastAPI(
        title="Nova Sprint Planning Backend",
        version="0.1.0",
        description="Receives meeting context and coordinates sprint planning through OpenRouter prompts.",
    )

    @app.get("/health", tags=["health"])
    def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    @app.post(
        "/api/v1/meetings/{meeting_id}/plan",
        response_model=PlanningResponse,
        status_code=status.HTTP_202_ACCEPTED,
        tags=["planning"],
    )
    def submit_plan(
        meeting_id: str,
        context: MeetingContext,
        service: PlanningService = Depends(get_planning_service),
    ) -> PlanningResponse:
        if context.meetingId != meeting_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="meetingId in path and body must match",
            )
        return service.submit_plan(context)

    @app.get(
        "/api/v1/meetings/{meeting_id}/plan",
        response_model=PlanningResponse,
        tags=["planning"],
    )
    def get_plan(
        meeting_id: str,
        service: PlanningService = Depends(get_planning_service),
    ) -> PlanningResponse:
        try:
            return service.get_plan(meeting_id)
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

    @app.post(
        "/api/v1/meetings/analyze",
        response_model=PlanningResponse,
        status_code=status.HTTP_200_OK,
        tags=["planning"],
    )
    async def analyze_meeting(
        context: str = Form(..., description="Meeting context payload (JSON)"),
        meeting_audio: UploadFile = File(..., description="Recorded meeting audio"),
        service: PlanningService = Depends(get_planning_service),
    ) -> PlanningResponse:
        try:
            context_payload = json.loads(context)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid context JSON: {exc}",
            ) from exc

        logger.info(
            "Received meeting analysis request: meetingId=%s audio=%s (%s bytes)",
            context_payload.get("meetingId"),
            meeting_audio.filename,
            meeting_audio.size if hasattr(meeting_audio, "size") else "unknown",
        )

        transcript = await transcribe_upload(meeting_audio)
        context_payload["transcript"] = transcript

        try:
            meeting_context = MeetingContext.model_validate(context_payload)
        except ValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=exc.errors(),
            ) from exc

        response = service.submit_plan(meeting_context)
        logger.info(
            "Generated plan: meetingId=%s status=%s agentJobId=%s",
            response.meetingId,
            response.status,
            response.agentJobId,
        )
        return response

    return app


app = create_app()

