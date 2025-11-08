import type { RawTaskInput, TaskNode } from '../types/project';

interface TaskTableProps {
  parsedTasks: RawTaskInput[];
  enrichedTasks: TaskNode[];
}

const isEnriched = (task: RawTaskInput | TaskNode): task is TaskNode => 'id' in task;

export default function TaskTable({ parsedTasks, enrichedTasks }: TaskTableProps) {
  const tasks = (enrichedTasks.length ? enrichedTasks : parsedTasks) as (RawTaskInput | TaskNode)[];
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <p className="text-sm text-slate-500">Parsed Tasks</p>
          <h3 className="text-xl font-semibold text-slate-900">{tasks.length} items</h3>
        </div>
      </div>
      <div className="mt-4 overflow-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Task</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Depends On</th>
              <th className="px-3 py-2">Hours</th>
              <th className="px-3 py-2">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {tasks.map((task) => (
              <tr key={isEnriched(task) ? task.id : task.name}>
                <td className="px-3 py-2">
                  <div className="font-medium text-slate-900">{task.name}</div>
                  <p className="text-xs text-slate-500">{task.description}</p>
                </td>
                <td className="px-3 py-2">{isEnriched(task) ? task.owner : task.owner || 'Unassigned'}</td>
                <td className="px-3 py-2 text-xs text-slate-500">{task.depends_on?.length ? task.depends_on.join(', ') : '—'}</td>
                <td className="px-3 py-2">{isEnriched(task) ? task.hours : '—'}</td>
                <td className="px-3 py-2 text-xs">{isEnriched(task) ? task.risk : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
