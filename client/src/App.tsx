import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';

type PageKey = 'dashboard' | 'tasks';

function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar active={activePage} onSelect={setActivePage} />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {activePage === 'dashboard' ? <Dashboard /> : <TaskList />}
      </main>
    </div>
  );
}

export default App;
