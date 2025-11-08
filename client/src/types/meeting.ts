import type { TaskNode } from './project';

export interface MeetingSummary {
  id: string;
  title: string;
  date: string;
  attendees: string[];
  summary: string;
  minutes: string;
  tasks: TaskNode[];
  resources: string[];
  hours: number;
  cost: number;
  transcript?: string;
  prompt?: string;
}
