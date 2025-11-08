import sampleTasks from './sampleResponse';
import type { MeetingSummary } from '../types/meeting';

const taskMap = Object.fromEntries(sampleTasks.tasks.map((task) => [task.id, task]));

export const meetings: MeetingSummary[] = [
  {
    id: 'kickoff',
    title: 'Go-to-Market Kickoff',
    date: '2024-10-01',
    attendees: ['Avery', 'Kai', 'Mina'],
    summary: 'Aligned on GTM enablement scope and automation goals.',
    minutes:
      'Discussed Whisper ingestion for discovery calls, outlined dependencies with ops tooling, and captured PM/Design action items.',
    tasks: [taskMap.T1, taskMap.T2].filter(Boolean),
    resources: ['Modal GPU hours', 'GTM enablement notion doc'],
    hours: 42,
    cost: 6300
  },
  {
    id: 'retro',
    title: 'Agent Ops Sync',
    date: '2024-10-05',
    attendees: ['Elena', 'Avery', 'Lucas'],
    summary: 'Reviewed staffing utilization and blockers.',
    minutes: 'Modal deployment risks, vendor security requirements, and coverage for QA readiness were reviewed.',
    tasks: [taskMap.T3].filter(Boolean),
    resources: ['Security checklist', 'QA triage board'],
    hours: 35,
    cost: 5250
  },
  {
    id: 'design',
    title: 'Design QA Jam',
    date: '2024-10-09',
    attendees: ['Mina', 'Drew'],
    summary: 'Validated dashboard UX and Gantt components.',
    minutes: 'Walked through DAG microinteractions, timeline charts, and copy for the planner landing page.',
    tasks: [taskMap.T4].filter(Boolean),
    resources: ['Figma file', 'Component checklist'],
    hours: 24,
    cost: 3600
  }
];
