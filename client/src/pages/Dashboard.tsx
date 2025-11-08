import { useEffect, useState } from 'react';
import DependencyGraph from '../components/DependencyGraph';
import Tabs from '../components/Tabs';
import TaskTable from '../components/TaskTable';
import FilesToFix from '../components/FilesToFix';
import MeetingMinutes from '../components/MeetingMinutes';
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
  const [editableMeetings, setEditableMeetings] = useState<Record<string, { title: string; attendees: string }>>(() =>
    meetings.reduce((acc, meeting) => {
      acc[meeting.id] = {
        title: meeting.title,
        attendees: meeting.attendees.join(', ')
      };
      return acc;
    }, {} as Record<string, { title: string; attendees: string }>)
  );
  useEffect(() => {
    setEditableMeetings((prev) => {
      const next = { ...prev };
      meetings.forEach((meeting) => {
        if (!next[meeting.id]) {
          next[meeting.id] = { title: meeting.title, attendees: meeting.attendees.join(', ') };
        }
      });
      return next;
    });
  }, [meetings]);
  const { data: analysis, loading: analyzing } = useProjectAnalysis();
  const activeMeeting = meetings.find((meeting) => meeting.id === activeMeetingId) ?? meetings[0];
  const meetingDraft = editableMeetings[activeMeeting?.id || ''] ?? { title: activeMeeting?.title || '', attendees: activeMeeting?.attendees.join(', ') || '' };
  const seededTasks = activeMeeting?.tasks ?? [];
  const meetingTaskIds = new Set(seededTasks.map((task) => task.id));
  const meetingAnalysisTasks = (analysis?.tasks || []).filter((task) =>
    meetingTaskIds.size ? meetingTaskIds.has(task.id) : true
  );
  const dependencyTasks = meetingAnalysisTasks.length ? meetingAnalysisTasks : seededTasks;
  const parsedSource = seededTasks;

  const sortedMeetings = [...meetings].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="max-h-64 overflow-y-auto rounded-2xl border border-slate-100">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Meeting</th>
                <th className="px-4 py-3">Attendees</th>
                <th className="px-4 py-3">Hours</th>
                <th className="px-4 py-3">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedMeetings.map((meeting) => (
                <tr
                  key={meeting.id}
                  className={`cursor-pointer transition hover:bg-slate-50 ${
                    meeting.id === activeMeetingId ? 'bg-slate-900/5' : ''
                  }`}
                  onClick={() => onSelectMeeting(meeting.id)}
                >
                  <td className="px-4 py-3 text-xs text-slate-500">{meeting.date}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                    {editableMeetings[meeting.id]?.title || meeting.title}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {editableMeetings[meeting.id]?.attendees || meeting.attendees.join(', ')}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{meeting.hours}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">${meeting.cost.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

     {activeMeeting && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Meeting overview</p>
              <h2
                className="text-2xl font-semibold text-slate-900"
                contentEditable
                suppressContentEditableWarning
                onBlur={(event) => {
                  const value = event.currentTarget.textContent?.trim() || activeMeeting.title;
                  setEditableMeetings((prev) => ({
                    ...prev,
                    [activeMeeting.id]: { ...prev[activeMeeting.id], title: value }
                  }));
                }}
              >
                {meetingDraft.title}
              </h2>
              <p
                className="text-sm text-slate-500"
                contentEditable
                suppressContentEditableWarning
                onBlur={(event) => {
                  const value = event.currentTarget.textContent?.trim() || activeMeeting.attendees.join(', ');
                  setEditableMeetings((prev) => ({
                    ...prev,
                    [activeMeeting.id]: { ...prev[activeMeeting.id], attendees: value }
                  }));
                }}
              >
                {activeMeeting.date} • {meetingDraft.attendees}
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

      {/* Files to Fix Section */}
      {activeMeeting?.resources && activeMeeting.resources.length > 0 && (
        <FilesToFix files={activeMeeting.resources} meetingTitle={activeMeeting.title} />
      )}

      {/* Meeting Minutes Section */}
      {activeMeeting?.plan && (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Meeting Minutes</h2>
          <MeetingMinutes 
            summary={activeMeeting.summary}
            risks={activeMeeting.plan.risks}
            milestones={activeMeeting.plan.milestones}
            transcript={activeMeeting.transcript}
          />
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
