export interface ParticipantInput {
  name: string;
  role: string;
}

export interface IssueInput {
  id?: string;
  title: string;
  url?: string;
}

export interface ProjectInput {
  name: string;
  repositoryUrl?: string;
  goal?: string;
}

export interface MeetingContextPayload {
  meetingId: string;
  project: ProjectInput;
  participants: ParticipantInput[];
  issues: IssueInput[];
  transcript?: string;
}

export interface PlanningTask {
  title: string;
  owner?: string | null;
  areas?: string[];
  etaDays?: number | null;
  notes?: string | null;
  dependsOn?: string[];
}

export interface PlanningMilestone {
  title: string;
  dueDate?: string | null;
  tasks: PlanningTask[];
}

export interface PlanningPlan {
  summary?: string | null;
  risks: string[];
  milestones: PlanningMilestone[];
}

export type PlanStatus = 'processing' | 'ready' | 'failed';

export interface PlanningResponse {
  meetingId: string;
  status: PlanStatus;
  plan?: PlanningPlan | null;
  agentJobId?: string | null;
  error?: string | null;
  transcript?: string | null;
  prompt?: string | null;
}

