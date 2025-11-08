interface MeetingMinutesProps {
  summary: string;
  risks?: string[];
  milestones?: Array<{
    title: string;
    tasks: Array<{
      title: string;
      owner?: string | null;
      etaDays?: number | null;
      notes?: string | null;
    }>;
  }>;
  transcript?: string;
}

export default function MeetingMinutes({ summary, risks, milestones, transcript }: MeetingMinutesProps) {
  return (
    <div className="space-y-6">
      {/* Summary Section */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-base font-semibold text-slate-900">Executive Summary</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{summary}</p>
      </section>

      {/* Risks Section */}
      {risks && risks.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-base font-semibold text-amber-900">Risks & Considerations</h3>
          </div>
          <ul className="mt-3 space-y-2">
            {risks.map((risk, index) => (
              <li key={index} className="flex gap-2 text-sm text-amber-800">
                <span className="mt-1 flex-shrink-0 text-amber-600">•</span>
                <span className="leading-relaxed">{risk}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Milestones & Tasks Section */}
      {milestones && milestones.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="text-base font-semibold text-slate-900">Milestones & Action Items</h3>
          </div>
          <div className="mt-4 space-y-5">
            {milestones.map((milestone, milestoneIndex) => (
              <div key={milestoneIndex} className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                  {milestoneIndex + 1}. {milestone.title}
                </h4>
                <div className="space-y-2 pl-4">
                  {milestone.tasks.map((task, taskIndex) => (
                    <div
                      key={taskIndex}
                      className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900">{task.title}</p>
                          {task.notes && (
                            <p className="mt-1 text-xs text-slate-600">{task.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 text-right">
                          {task.owner && (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {task.owner}
                            </span>
                          )}
                          {task.etaDays != null && (
                            <span className="text-xs text-slate-500">
                              {task.etaDays} {task.etaDays === 1 ? 'day' : 'days'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Transcript Section (Collapsible) */}
      {transcript && (
        <details className="rounded-2xl border border-slate-200 bg-slate-50">
          <summary className="cursor-pointer p-5 font-semibold text-slate-700 hover:text-slate-900">
            <div className="inline-flex items-center gap-2">
              <svg
                className="h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Full Transcript
            </div>
          </summary>
          <div className="px-5 pb-5">
            <div className="rounded-lg bg-white p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                {transcript}
              </p>
            </div>
          </div>
        </details>
      )}
    </div>
  );
}

