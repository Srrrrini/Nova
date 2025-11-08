import { useMemo } from 'react';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { TaskNode } from '../types/project';

interface TimelineChartProps {
  tasks: TaskNode[];
}

export default function TimelineChart({ tasks }: TimelineChartProps) {
  const data = useMemo(() => {
    let rolling = 0;
    return tasks.map((task) => {
      const start = rolling;
      const duration = Math.max(1, Math.round(task.hours / 8));
      rolling += duration;
      return {
        name: task.name,
        owner: task.owner,
        start,
        end: start + duration,
        duration
      };
    });
  }, [tasks]);

  return (
    <div className="h-[360px] rounded-3xl border border-slate-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">Timeline</p>
        <span className="text-xs text-slate-400">Duration approximated from hours</span>
      </div>
      {data.length ? (
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={70} />
            <YAxis tick={{ fontSize: 12 }} label={{ value: 'Sprints', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="duration" fill="#4f46e5" name="Sprint span" radius={[8, 8, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-slate-400">Run an analysis to view the Gantt</div>
      )}
    </div>
  );
}
