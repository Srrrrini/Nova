import { useState } from 'react';
import DependencyGraph from '../components/DependencyGraph';
import Tabs from '../components/Tabs';
import TaskTable from '../components/TaskTable';
import { useProjectAnalysis } from '../hooks/useProjectAnalysis';
import type { MeetingSummary } from '../types/meeting';
import type { TaskNode } from '../types/project';

interface DashboardProps {
  meetings: MeetingSummary[];
  activeMeetingId: string;
  onSelectMeeting: (meetingId: string) => void;
}

export default function Dashboard({ meetings, activeMeetingId, onSelectMeeting }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'tasks' | 'dependencies'>('tasks');
  const { data: analysis, loading: analyzing } = useProjectAnalysis();
  const activeMeeting = meetings.find((meeting) => meeting.id === activeMeetingId) ?? meetings[0];
  const seededTasks = activeMeeting?.tasks ?? [];
  const meetingTaskIds = new Set(seededTasks.map((task) => task.id));
  const meetingAnalysisTasks = (analysis?.tasks || []).filter((task) =>
    meetingTaskIds.size ? meetingTaskIds.has(task.id) : true
  );
  const dependencyTasks = meetingAnalysisTasks.length ? meetingAnalysisTasks : seededTasks;
  const parsedSource = seededTasks;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="space-y-2 text-center">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Agentic planner</p>
        <h1 className="text-4xl font-semibold text-slate-900">{meetings.find((m) => m.id === activeMeetingId)?.title ?? 'Meeting workspace'}</h1>
        <p className="text-slate-600">Select a meeting to inspect dependencies, tasks, and staffing outputs.</p>
      </header>

      <div className="flex flex-wrap justify-center gap-3">
        {meetings.map((meeting) => (
          <button
            key={meeting.id}
            onClick={() => onSelectMeeting(meeting.id)}
            className={`rounded-full border px-4 py-2 text-sm ${
              meeting.id === activeMeetingId ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600'
            }`}
          >
            {meeting.title}
          </button>
        ))}
      </div>

     {activeMeeting && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Meeting overview</p>
              <h2 className="text-2xl font-semibold text-slate-900">{activeMeeting.title}</h2>
              <p className="text-sm text-slate-500">
                {activeMeeting.date} • {activeMeeting.attendees.join(', ')}
              </p>
            </div>
            <div className="rounded-full border border-slate-200 px-4 py-2 text-xs text-slate-600">
              {activeMeeting.tasks.length} linked tasks
            </div>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Summary</p>
              <p className="mt-2 text-sm text-slate-600">{activeMeeting.summary}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Minutes</p>
              <p className="mt-2 text-sm text-slate-600">{activeMeeting.minutes}</p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Resources</p>
              <p className="mt-2 text-sm text-slate-700 line-clamp-3">{activeMeeting.resources.join(', ')}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Hours</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{activeMeeting.hours}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Cost</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">${activeMeeting.cost.toLocaleString()}</p>
            </div>
          </div>
        </section>
      )}

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <Tabs active={activeTab} onChange={setActiveTab}>
          {activeTab === 'tasks' && (
            <TaskTable parsedTasks={parsedSource} enrichedTasks={meetingAnalysisTasks as TaskNode[]} />
          )}
          {activeTab === 'dependencies' && <DependencyGraph tasks={dependencyTasks as TaskNode[]} />}
        </Tabs>
      </div>
    </div>
  );
}
