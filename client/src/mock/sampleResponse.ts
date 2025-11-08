import type { AnalysisResponse } from '../types/project';

const sampleTasks: AnalysisResponse = {
  summary: {
    total_hours: 240,
    staffing: '4 engineers + 1 PM (~6 weeks)',
    risks: ['Integration with legacy API', 'Vendor security review pending'],
    blockers: ['Waiting on compliance sign-off']
  },
  employees: [
    {
      name: 'Ada Lovelace',
      capacity_hours: 120,
      utilization: 0.8,
      tasks: ['T1', 'T4']
    },
    {
      name: 'Grace Hopper',
      capacity_hours: 110,
      utilization: 0.75,
      tasks: ['T2', 'T3']
    }
  ],
  tasks: [
    {
      id: 'T1',
      name: 'Ingest legacy data',
      description: 'Map legacy ERP export to unified schema.',
      owner: 'Ada Lovelace',
      depends_on: [],
      hours: 60,
      risk: 'Medium',
      status: 'in_progress'
    },
    {
      id: 'T2',
      name: 'Define agent prompts',
      description: 'Design evaluation prompts for TaskParser and Dependency agents.',
      owner: 'Grace Hopper',
      depends_on: ['T1'],
      hours: 40,
      risk: 'Low',
      status: 'pending'
    },
    {
      id: 'T3',
      name: 'Modal deployment',
      description: 'Ship FastAPI backend as Modal function.',
      owner: 'Grace Hopper',
      depends_on: ['T1'],
      hours: 80,
      risk: 'High',
      status: 'blocked'
    },
    {
      id: 'T4',
      name: 'Timeline report UX',
      description: 'Implement React Flow DAG with Recharts timeline.',
      owner: 'Ada Lovelace',
      depends_on: ['T2'],
      hours: 60,
      risk: 'Low',
      status: 'pending'
    }
  ]
};

export default sampleTasks;
