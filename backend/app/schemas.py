from datetime import date
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class Participant(BaseModel):
    name: str = Field(..., description="Engineer name")
    role: str = Field(..., description="Role during the planning session")


class IssueReference(BaseModel):
    id: Optional[str] = Field(None, description="Repository issue or ticket identifier")
    title: str = Field(..., description="Short name of the issue")
    url: Optional[HttpUrl] = Field(None, description="Deep link to the issue in GitHub/Jira/etc.")


class ProjectInfo(BaseModel):
    name: str = Field(..., description="Project or sprint name")
    repositoryUrl: Optional[HttpUrl] = Field(
        None, description="Primary repository URL for the discussed project"
    )
    goal: Optional[str] = Field(None, description="High-level sprint or project goal")


class MeetingContext(BaseModel):
    meetingId: str = Field(..., description="Unique identifier chosen by the frontend")
    project: ProjectInfo
    participants: List[Participant]
    transcript: str = Field(..., description="Full transcript text captured by the frontend")
    issues: List[IssueReference] = Field(default_factory=list)


class PlanStatus(str, Enum):
    processing = "processing"
    ready = "ready"
    failed = "failed"


class TaskAssignment(BaseModel):
    title: str = Field(..., description="Task title or summary")
    owner: Optional[str] = Field(None, description="Name of the engineer responsible")
    areas: List[str] = Field(
        default_factory=list,
        description="Relevant code areas, directories, or files to touch",
    )
    etaDays: Optional[int] = Field(None, description="Estimated number of days to complete the task")
    notes: Optional[str] = Field(None, description="Additional implementation details or links")
    dependsOn: List[str] = Field(
        default_factory=list,
        description="List of task titles this task depends on (must be completed first)",
    )


class Milestone(BaseModel):
    title: str
    dueDate: Optional[date] = Field(None, description="Target completion date")
    tasks: List[TaskAssignment] = Field(default_factory=list)


class PlanningPlan(BaseModel):
    summary: Optional[str] = Field(None, description="High-level outcome of the planning session")
    risks: List[str] = Field(default_factory=list, description="Potential risks or open questions")
    milestones: List[Milestone] = Field(default_factory=list)


class PlanningRecord(BaseModel):
    meetingId: str
    context: MeetingContext
    status: PlanStatus = PlanStatus.processing
    plan: Optional[PlanningPlan] = None
    agentJobId: Optional[str] = None
    error: Optional[str] = None
    prompt: Optional[str] = None


class PlanningResponse(BaseModel):
    meetingId: str
    status: PlanStatus
    plan: Optional[PlanningPlan] = None
    agentJobId: Optional[str] = None
    error: Optional[str] = None
    transcript: Optional[str] = None
    prompt: Optional[str] = None

