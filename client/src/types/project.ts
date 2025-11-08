export type TaskStatus = 'pending' | 'in_progress' | 'blocked' | 'done';

export interface RawTaskInput {
  name: string;
  description: string;
  owner?: string;
  depends_on?: string[];
}

export interface TaskNode {
  id: string;
  name: string;
  description: string;
  owner: string;
  depends_on: string[];
  hours: number;
  risk: string;
  status: TaskStatus;
}

export interface EmployeeAllocation {
  name: string;
  capacity_hours: number;
  utilization: number;
  tasks: string[];
}

export interface ProjectSummary {
  total_hours: number;
  staffing: string;
  risks: string[];
  blockers: string[];
}

export interface AnalysisResponse {
  employees: EmployeeAllocation[];
  tasks: TaskNode[];
  summary: ProjectSummary;
}

export interface ReportResponse {
  report: string;
  summary: ProjectSummary;
  download_url?: string;
  voice_url?: string;
}
