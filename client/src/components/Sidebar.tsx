import clsx from 'clsx';
import type { ReactNode } from 'react';

type NavKey = 'home' | 'dashboard' | 'tasks';

interface SidebarProps {
  active: NavKey;
  onSelect: (key: NavKey) => void;
}

const navItems: { key: NavKey; label: string; icon: ReactNode }[] = [
  {
    key: 'home',
    label: 'Home',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12l9-9 9 9" />
        <path d="M9 21V9h6v12" />
      </svg>
    )
  },
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  },
  {
    key: 'tasks',
    label: 'Task List',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 6h13" />
        <path d="M8 12h13" />
        <path d="M8 18h13" />
        <path d="M3 6h.01" />
        <path d="M3 12h.01" />
        <path d="M3 18h.01" />
      </svg>
    )
  }
];

export default function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <aside className="hidden w-72 flex-col justify-between border-r border-slate-200 bg-white px-6 py-8 shadow-lg lg:flex">
      <div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-2xl font-bold text-slate-900">
            <span className="h-3 w-3 rounded-full bg-indigo-500" />
            <span className="h-3 w-3 rounded-full bg-pink-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
          </div>
          <div>
            <p className="text-xl font-semibold text-slate-900">Agentic Planner</p>
            <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Dashboard</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center gap-2 text-center">
          <img
            src="https://i.pravatar.cc/120?img=47"
            alt="User avatar"
            className="h-20 w-20 rounded-full border-4 border-slate-100 object-cover"
          />
          <div>
            <p className="text-lg font-semibold text-slate-900">Avery Johnson</p>
            <p className="text-sm text-slate-500">avery.johnson@example.com</p>
          </div>
        </div>
        <nav className="mt-10 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={clsx(
                'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition',
                active === item.key ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:bg-slate-100'
              )}
            >
              <span className="text-current">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="rounded-3xl bg-gradient-to-r from-indigo-500 to-blue-500 p-4 text-sm text-white">
        <p className="font-semibold">Pro tip</p>
        <p className="text-xs text-indigo-50">Tap meeting titles or attendees to tweak the AI summary on the fly.</p>
      </div>
    </aside>
  );
}
