import sampleTasks from '../mock/sampleResponse';

const tasks = sampleTasks.tasks;

export default function TaskList() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2 text-center lg:text-left">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-slate-500">Task list</p>
        <h1 className="text-3xl font-semibold text-slate-900">Backlog overview</h1>
        <p className="text-slate-600">Review auto-generated tasks, dependencies, and owners.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {tasks.map((task) => (
          <article key={task.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{task.status}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{task.owner}</span>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">{task.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{task.description}</p>
            <ul className="mt-3 text-xs text-slate-500">
              <li>Depends on: {task.depends_on.length ? task.depends_on.join(', ') : 'None'}</li>
              <li>Hours: {task.hours}</li>
              <li>Risk: {task.risk}</li>
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}
