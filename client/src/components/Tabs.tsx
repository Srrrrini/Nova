import clsx from 'clsx';
import type { ReactNode } from 'react';

type TabKey = 'tasks' | 'dependencies' | 'reports';

interface TabItem {
  key: TabKey;
  label: string;
}

const tabs: TabItem[] = [
  { key: 'tasks', label: 'Tasks' },
  { key: 'dependencies', label: 'Dependencies' },
  { key: 'reports', label: 'Reports' }
];

interface TabsProps {
  active: TabKey;
  onChange: (key: TabKey) => void;
  children: ReactNode;
}

export default function Tabs({ active, onChange, children }: TabsProps) {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 rounded-full bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={clsx(
              'flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all',
              active === tab.key ? 'bg-white text-slate-900 shadow' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}
