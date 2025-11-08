import { useState } from 'react';
import sampleTasks from '../mock/sampleResponse';
import type { MeetingSummary } from '../types/meeting';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface HomeProps {
  meetings: MeetingSummary[];
  onReviewMeeting: (meetingId: string) => void;
  onViewTasks: () => void;
}

export default function Home({ meetings, onReviewMeeting, onViewTasks }: HomeProps) {
  const { recording, audioUrl, error: audioError, startRecording, stopRecording } = useAudioRecorder();
  const assignedTasks = sampleTasks.tasks.slice(0, 3);
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
  const [openMeeting, setOpenMeeting] = useState<MeetingSummary | null>(null);
  const [draftSummaries, setDraftSummaries] = useState<
    Record<string, { summary: string; minutes: string; title: string; attendees: string }>
  >(() =>
    meetings.reduce((acc, meeting) => {
      acc[meeting.id] = {
        summary: meeting.summary,
        minutes: meeting.minutes,
        title: meeting.title,
        attendees: meeting.attendees.join(', ')
      };
      return acc;
    }, {} as Record<string, { summary: string; minutes: string; title: string; attendees: string }>)
  );

  const handleTitleBlur = (meetingId: string, fallback: string, value?: string | null) => {
    setDraftSummaries((prev) => ({
      ...prev,
      [meetingId]: {
        ...prev[meetingId],
        title: value?.trim() ? value : fallback
      }
    }));
  };

  const handleAttendeesBlur = (meetingId: string, fallback: string, value?: string | null) => {
    setDraftSummaries((prev) => ({
      ...prev,
      [meetingId]: {
        ...prev[meetingId],
        attendees: value?.trim() ? value : fallback
      }
    }));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <header className="space-y-1">
        <p className="text-3xl font-semibold text-slate-900">Hello, Avery</p>
        <p className="text-slate-500">Today is {today}</p>
      </header>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Meeting capture</p>
            <p className="text-slate-700">Start a recording to capture live requirements.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => (recording ? stopRecording() : startRecording())}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition ${
                recording ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="3" width="6" height="12" rx="3" />
                <path d="M5 11v1a7 7 0 0 0 14 0v-1" />
                <path d="M12 19v2" />
                <path d="M8 21h8" />
              </svg>
              {recording ? 'End meeting' : 'Start meeting'}
            </button>
            {audioUrl && !recording && <span className="text-xs text-slate-500">Recording captured</span>}
          </div>
        </div>
        {audioError && <p className="mt-3 text-sm text-rose-600">{audioError}</p>}
        {audioUrl && !recording && (
          <audio controls className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <source src={audioUrl} />
          </audio>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Recent meetings</h2>
          <button className="text-sm text-slate-500 hover:text-slate-700" onClick={() => onReviewMeeting(meetings[0]?.id ?? '')}>
            View dashboard →
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {meetings.slice(0, 3).map((meeting) => (
            <button
              key={meeting.id}
              onClick={() => setOpenMeeting(meeting)}
              className="rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-1"
            >
              <p className="text-xs uppercase tracking-wide text-slate-500">{meeting.date}</p>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {draftSummaries[meeting.id]?.title || meeting.title}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {draftSummaries[meeting.id]?.attendees || meeting.attendees.join(', ')}
              </p>
              <p className="mt-2 text-sm text-slate-600 line-clamp-3">{draftSummaries[meeting.id]?.summary}</p>
              <div className="mt-3 text-xs text-slate-500">
                Tasks ({meeting.tasks.length}): {meeting.tasks.map((task) => task.name).join(', ')}
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Your tasks</h2>
          <button className="text-sm text-slate-500 hover:text-slate-700" onClick={onViewTasks}>
            View all tasks →
          </button>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {assignedTasks.map((task) => (
            <article key={task.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-slate-500">{task.status}</p>
              <h3 className="mt-2 text-base font-semibold text-slate-900">{task.name}</h3>
              <p className="mt-1 text-xs text-slate-500">Hours: {task.hours}</p>
              <p className="text-xs text-slate-500">Depends on: {task.depends_on.length ? task.depends_on.join(', ') : 'None'}</p>
            </article>
          ))}
        </div>
      </section>

      {openMeeting && (
        (() => {
          const meetingId = openMeeting.id;
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 px-4">
              <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Meeting</p>
                <p className="text-[10px] uppercase tracking-[0.4em] text-slate-400">{openMeeting.date}</p>
                <h3
                  className="text-2xl font-semibold text-slate-900"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(event) => handleTitleBlur(meetingId, openMeeting.title, event.currentTarget.textContent)}
                >
                  {draftSummaries[meetingId]?.title}
                </h3>
                <p
                  className="text-sm text-slate-500"
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(event) => handleAttendeesBlur(meetingId, openMeeting.attendees.join(', '), event.currentTarget.textContent)}
                >
                  {draftSummaries[meetingId]?.attendees}
                </p>
              </div>
                  <button className="text-slate-400 hover:text-slate-600" onClick={() => setOpenMeeting(null)}>
                    ✕
                  </button>
                </div>
                <div className="mt-4 space-y-4">
                  <label className="block text-sm font-medium text-slate-600">
                    Summary
                    <textarea
                      className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-sm"
                      rows={3}
                      value={draftSummaries[meetingId]?.summary}
                      onChange={(event) =>
                        setDraftSummaries((prev) => ({
                          ...prev,
                          [meetingId]: { ...prev[meetingId], summary: event.target.value }
                        }))
                      }
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-600">
                    Meeting minutes
                    <textarea
                      className="mt-1 w-full rounded-2xl border border-slate-200 p-3 text-sm"
                      rows={4}
                      value={draftSummaries[meetingId]?.minutes}
                      onChange={(event) =>
                        setDraftSummaries((prev) => ({
                          ...prev,
                          [meetingId]: { ...prev[meetingId], minutes: event.target.value }
                        }))
                      }
                    />
                  </label>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                    <p className="font-semibold text-slate-500">Tasks linked</p>
                    <ul className="mt-1 list-disc pl-4">
                      {openMeeting.tasks.map((task) => (
                        <li key={task.id}>{task.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap justify-end gap-3 text-sm">
                  <button className="rounded-full border border-slate-200 px-4 py-2" onClick={() => setOpenMeeting(null)}>
                    Close
                  </button>
                  <button
                    className="rounded-full bg-slate-900 px-4 py-2 text-white"
                    onClick={() => {
                      onReviewMeeting(openMeeting.id);
                      setOpenMeeting(null);
                    }}
                  >
                    View full meeting
                  </button>
                </div>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
