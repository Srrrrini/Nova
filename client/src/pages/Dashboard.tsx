import { useState } from 'react';
import DependencyGraph from '../components/DependencyGraph';
import ReportPanel from '../components/ReportPanel';
import SummaryCards from '../components/SummaryCards';
import Tabs from '../components/Tabs';
import TaskInput from '../components/TaskInput';
import TaskTable from '../components/TaskTable';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useProjectAnalysis } from '../hooks/useProjectAnalysis';
import { useReport } from '../hooks/useReport';
import type { RawTaskInput } from '../types/project';

export default function Dashboard() {
  const [parsed, setParsed] = useState<RawTaskInput[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'dependencies' | 'reports'>('tasks');
  const { data: analysis, loading: analyzing, error, analyze } = useProjectAnalysis();
  const { data: report, loading: reportLoading, error: reportError, generateReport } = useReport();
  const { recording, audioUrl, error: audioError, startRecording, stopRecording } = useAudioRecorder();

  const handleAnalyze = async () => {
    if (!parsed.length) return;
    await analyze(parsed);
    setActiveTab('dependencies');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <header className="flex flex-col items-center gap-4 text-center">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Agentic planner</p>
          <h1 className="text-4xl font-semibold text-slate-900">Let agents listen, infer, and plan automatically</h1>
          <p className="text-slate-600">Kick off a meeting recording, then paste or upload backlog notes to generate dependencies and staffing plans.</p>
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
      </header>

      {audioError && <p className="text-sm text-rose-600">{audioError}</p>}
      {audioUrl && !recording && (
        <audio controls className="w-full rounded-2xl border border-slate-200 bg-white p-2">
          <source src={audioUrl} />
        </audio>
      )}

      <SummaryCards analysis={analysis} />

      <TaskInput onChange={setParsed} disabled={analyzing || recording} />

      <div className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!parsed.length || analyzing}
            className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white disabled:bg-slate-400"
          >
            {analyzing ? 'Analyzing…' : 'Analyze Project'}
          </button>
          {error && <span className="text-sm text-rose-600">{error}</span>}
        </div>

        <Tabs active={activeTab} onChange={setActiveTab}>
          {activeTab === 'tasks' && <TaskTable parsedTasks={parsed} enrichedTasks={analysis?.tasks || []} />}
          {activeTab === 'dependencies' && <DependencyGraph tasks={analysis?.tasks || []} />}
          {activeTab === 'reports' && (
            <ReportPanel
              analysis={analysis || null}
              report={report}
              onGenerate={() => generateReport(analysis || null)}
              loading={reportLoading}
            />
          )}
        </Tabs>
        {reportError && <span className="text-sm text-rose-600">{reportError}</span>}
      </div>
    </div>
  );
}
