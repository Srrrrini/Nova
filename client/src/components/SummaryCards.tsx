import type { AnalysisResponse } from '../types/project';

interface SummaryCardsProps {
  analysis?: AnalysisResponse | null;
}

export default function SummaryCards({ analysis }: SummaryCardsProps) {
  if (!analysis) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Total Hours</p>
        <p className="text-3xl font-semibold text-slate-900">{summary.total_hours}</p>
        <p className="text-xs text-slate-500">Across {analysis.tasks.length} tasks</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Staffing Plan</p>
        <p className="text-lg font-medium text-slate-900">{summary.staffing}</p>
        <p className="text-xs text-slate-500">{employees.length} employees</p>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Risks & blockers</p>
        <ul className="text-xs text-slate-600">
          {summary.risks.map((risk) => (
            <li key={risk}>• {risk}</li>
          ))}
          {summary.blockers.map((risk) => (
            <li key={risk}>• {risk}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
