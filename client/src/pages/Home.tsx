import { useEffect, useState } from 'react';
import type { MeetingSummary } from '../types/meeting';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import type { MeetingContextPayload, PlanningResponse } from '../types/plan';
import { planResponseToMeeting } from '../utils/planTransform';
import FilesToFix from '../components/FilesToFix';
import MeetingMinutes from '../components/MeetingMinutes';

interface HomeProps {
  meetings: MeetingSummary[];
  onReviewMeeting: (meetingId: string) => void;
  onMeetingGenerated: (meeting: MeetingSummary) => void;
  onViewTasks: () => void;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const DEFAULT_PROJECT = {
  name: 'Nova Sprint 13',
  repositoryUrl: 'https://github.com/Srrrrini/Nova',
  goal: 'Migrate to SQLite storage, implement Redis caching for GitHub API, and improve OpenRouter timeout handling'
};

const DEFAULT_PARTICIPANTS = [
  { name: 'Srinivas', role: 'Engineering Manager' },
  { name: 'Dan', role: 'Backend Engineer' }
];

const DEFAULT_ISSUES = [
  {
    id: 'NOVA-134',
    title: 'Migrate meeting plans and analysis history to SQLite',
    url: 'https://github.com/your-org/nova/issues/134'
  },
  {
    id: 'NOVA-135',
    title: 'Add Redis caching for GitHub code search to reduce API rate limiting',
    url: 'https://github.com/your-org/nova/issues/135'
  },
  {
    id: 'NOVA-137',
    title: 'Improve OpenRouter timeout handling with retry logic and better error messages',
    url: 'https://github.com/your-org/nova/issues/137'
  }
];

export default function Home({ meetings, onReviewMeeting, onMeetingGenerated, onViewTasks }: HomeProps) {
  const { recording, audioUrl: recordedAudioUrl, audioBlob: recordedAudioBlob, error: audioError, startRecording, stopRecording } = useAudioRecorder();
  const [defaultAudioUrl, setDefaultAudioUrl] = useState<string | null>(null);
  const [defaultAudioBlob, setDefaultAudioBlob] = useState<Blob | null>(null);
  const [useDefaultAudio, setUseDefaultAudio] = useState(true);
  
  // Use default audio by default, or recorded audio if explicitly recorded
  const audioUrl = useDefaultAudio ? defaultAudioUrl : recordedAudioUrl;
  const audioBlob = useDefaultAudio ? defaultAudioBlob : recordedAudioBlob;
  
  const assignedTasks = meetings.flatMap((meeting) => meeting.tasks).slice(0, 3);
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

  useEffect(() => {
    setDraftSummaries((prev) => {
      const next = { ...prev };
      meetings.forEach((meeting) => {
        if (!next[meeting.id]) {
          next[meeting.id] = {
            summary: meeting.summary,
            minutes: meeting.minutes,
            title: meeting.title,
            attendees: meeting.attendees.join(', ')
          };
        }
      });
      return next;
    });
  }, [meetings]);

  // Load default audio file on mount
  useEffect(() => {
    let objectUrl: string | null = null;
    const loadDefaultAudio = async () => {
      try {
        const response = await fetch('/project_recording.mp3');
        if (response.ok) {
          const blob = await response.blob();
          objectUrl = URL.createObjectURL(blob);
          setDefaultAudioBlob(blob);
          setDefaultAudioUrl(objectUrl);
          console.log('[audio] loaded default audio file, size:', blob.size, 'bytes, type:', blob.type);
        }
      } catch (err) {
        console.warn('[audio] default audio file not found, will use recording:', err);
      }
    };
    loadDefaultAudio();

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, []);

  // Switch to recorded audio when recording stops
  useEffect(() => {
    if (recordedAudioBlob && !recording) {
      setUseDefaultAudio(false);
      console.log('[audio] switched to recorded audio, size:', recordedAudioBlob.size, 'bytes');
    }
  }, [recordedAudioBlob, recording]);

  const handleTitleBlur = (meetingId: string, fallback: string, value?: string | null) => {
    setDraftSummaries((prev) => ({
      ...prev,
      [meetingId]: {
        ...prev[meetingId],
        title: value?.trim() ? value : fallback
      }
    }));
  };

  const [analyzingMeeting, setAnalyzingMeeting] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleAnalyzeMeeting = async () => {
    if (!audioBlob || analyzingMeeting) return;
    setAnalyzingMeeting(true);
    setAnalysisError(null);
    try {
      // Use a consistent meeting ID based on today's date so it saves to the same file
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
      const meetingId = `sp-${dateStr}`;
      const contextPayload: MeetingContextPayload = {
        meetingId,
        project: DEFAULT_PROJECT,
        participants: DEFAULT_PARTICIPANTS,
        issues: DEFAULT_ISSUES
      };

      const form = new FormData();
      const audioFilename = useDefaultAudio ? 'project_recording.mp3' : `meeting-${meetingId}.webm`;
      form.append('meeting_audio', audioBlob, audioFilename);
      form.append('context', JSON.stringify(contextPayload));

      console.log('[meeting] submitting analysis request', {
        meetingId,
        audioSource: useDefaultAudio ? 'default (project_recording.mp3)' : 'recorded',
        audioBytes: audioBlob.size,
        audioType: audioBlob.type,
        context: contextPayload
      });
      const res = await fetch(`${API_BASE}/meetings/analyze`, {
        method: 'POST',
        body: form
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Failed to analyze meeting');
      }
      const planning = (await res.json()) as PlanningResponse;
      console.log('[meeting] analysis response received', {
        meetingId: planning.meetingId,
        status: planning.status,
        agentJobId: planning.agentJobId
      });
      const meetingSummary = planResponseToMeeting(planning, contextPayload);
      onMeetingGenerated(meetingSummary);
      onReviewMeeting(meetingSummary.id);
    } catch (err) {
      console.error('[meeting] analysis request failed', err);
      setAnalysisError((err as Error).message);
    } finally {
      setAnalyzingMeeting(false);
    }
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
            {audioUrl && !recording && (
              <span className="text-xs text-slate-500">
                {useDefaultAudio ? '✓ Using default audio (3min)' : 'Using recorded audio'}
              </span>
            )}
            {!useDefaultAudio && recordedAudioBlob && defaultAudioBlob && (
              <button
                type="button"
                onClick={() => setUseDefaultAudio(true)}
                className="text-xs text-blue-600 hover:text-blue-700 underline"
              >
                Switch to default audio
              </button>
            )}
            {audioUrl && !recording && (
              <button
                type="button"
                onClick={handleAnalyzeMeeting}
                disabled={!audioBlob || analyzingMeeting}
                className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50"
              >
                {analyzingMeeting && <span className="h-3 w-3 animate-spin rounded-full border border-slate-400 border-t-transparent" />}
                {analyzingMeeting ? 'Analyzing…' : 'Analyze meeting'}
              </button>
            )}
          </div>
        </div>
        {audioError && <p className="mt-3 text-sm text-rose-600">{audioError}</p>}
        {analysisError && <p className="text-sm text-rose-600">{analysisError}</p>}
        {audioUrl && !recording && (
          <audio controls className="mt-4 w-full rounded-2xl border border-slate-200 bg-slate-50 p-2">
            <source src={audioUrl} />
          </audio>
        )}
      </section>

      {/* Files to Fix Section */}
      {meetings.length > 0 && meetings[0].resources && (
        <FilesToFix files={meetings[0].resources} meetingTitle={meetings[0].title} />
      )}

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
                  {/* Meeting Minutes with structured display */}
                  <MeetingMinutes 
                    summary={draftSummaries[meetingId]?.summary || openMeeting.summary}
                    risks={openMeeting.plan?.risks}
                    milestones={openMeeting.plan?.milestones}
                    transcript={openMeeting.transcript}
                  />

                  {openMeeting.prompt && (
                    <details className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
                      <summary className="cursor-pointer font-semibold text-slate-500">
                        LLM Prompt (debug)
                      </summary>
                      <pre className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600">
                        {openMeeting.prompt}
                      </pre>
                    </details>
                  )}
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
