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
    resources: ['app/services/whisper.py', 'app/endpoints/meetings.py', 'frontend/components/Dashboard.tsx'],
    hours: 42,
    cost: 6300,
    plan: {
      summary: 'Aligned on GTM enablement scope and automation goals. The team will focus on Whisper ingestion for discovery calls and outline dependencies with ops tooling.',
      risks: [
        'Whisper API rate limits may impact transcription performance during high-volume periods',
        'Integration with existing ops tooling may require additional security reviews',
        'Timeline dependencies on PM/Design deliverables could shift sprint goals'
      ],
      milestones: [
        {
          title: 'Discovery & Planning',
          dueDate: '2024-10-05',
          tasks: [
            {
              title: 'Research Whisper API integration patterns',
              owner: 'Kai',
              areas: ['app/services/whisper.py', 'docs/api-integration.md'],
              etaDays: 2,
              notes: 'Review existing Whisper implementations and identify best practices',
              dependsOn: []
            },
            {
              title: 'Define ops tooling integration requirements',
              owner: 'Avery',
              areas: ['app/config/ops-integration.yaml'],
              etaDays: 1,
              notes: 'Document required endpoints and data formats',
              dependsOn: []
            }
          ]
        },
        {
          title: 'Implementation',
          dueDate: '2024-10-15',
          tasks: [
            {
              title: 'Implement Whisper transcription service',
              owner: 'Kai',
              areas: ['app/services/whisper.py', 'app/endpoints/meetings.py'],
              etaDays: 5,
              notes: 'Build service layer for audio transcription with error handling',
              dependsOn: ['Research Whisper API integration patterns']
            },
            {
              title: 'Build dashboard components for meeting analysis',
              owner: 'Mina',
              areas: ['frontend/components/Dashboard.tsx', 'frontend/components/MeetingView.tsx'],
              etaDays: 4,
              notes: 'Create UI components for displaying transcription and analysis results',
              dependsOn: ['Define ops tooling integration requirements']
            }
          ]
        }
      ]
    },
    transcript: 'Hey team, thanks for joining. Let\'s kick off our GTM enablement planning. Avery, can you walk us through the scope? Sure, we\'re looking at integrating Whisper for transcription of discovery calls. The goal is to automatically capture requirements and surface action items. That sounds great. Kai, what\'s your take on the technical feasibility? I think it\'s definitely doable. We\'ll need to handle rate limits carefully and ensure we have proper error handling. I can start researching integration patterns this week. Perfect. Mina, from a design perspective, how do you see this fitting into the dashboard? I\'m thinking we add a new section for meeting analysis with transcripts and extracted tasks. Should take about 4-5 days to implement once we have the backend ready...'
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

export default meetings;
