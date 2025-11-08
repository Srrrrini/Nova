import type { AnalysisResponse, ReportResponse } from '../types/project';

interface ReportPanelProps {
  analysis: AnalysisResponse | null;
  report: ReportResponse | null;
  onGenerate: () => Promise<void> | void;
  loading: boolean;
}

export default function ReportPanel({ analysis, report, onGenerate, loading }: ReportPanelProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">Executive summary</p>
          <h3 className="text-2xl font-semibold text-slate-900">Reports & downloads</h3>
        </div>
        <button
          onClick={() => onGenerate()}
          disabled={!analysis || loading}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:bg-slate-400"
        >
          {loading ? 'Generating…' : 'Generate report'}
        </button>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-700">
        {report?.report || 'Reports provide narrative context, per-employee focus, and shareable links. Run a new analysis to enable this section.'}
      </div>
      {report && (
        <div className="mt-4 flex gap-3">
          {report.download_url ? (
            <a
              href={report.download_url}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm"
            >
              Download JSON
            </a>
          ) : null}
          {report.voice_url ? (
            <audio controls className="h-10">
              <source src={report.voice_url} />
            </audio>
          ) : null}
        </div>
      )}
    </div>
  );
}
