from fastapi import Depends, FastAPI, HTTPException, status

from .repository import PlanningRepository
from .schemas import MeetingContext, PlanningResponse
from .services.agentuity import AgentuityClient
from .services.planning import PlanningService


def get_repository() -> PlanningRepository:
    return _repository


def get_agentuity_client() -> AgentuityClient:
    return _agent_client


def get_planning_service(
    repository: PlanningRepository = Depends(get_repository),
    agentuity_client: AgentuityClient = Depends(get_agentuity_client),
) -> PlanningService:
    return PlanningService(repository=repository, agent_client=agentuity_client)


_repository = PlanningRepository()
_agent_client = AgentuityClient()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Nova Sprint Planning Backend",
        version="0.1.0",
        description="Receives meeting context and coordinates sprint planning via Agentuity agents.",
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

    return app


app = create_app()

