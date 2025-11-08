import { useState } from 'react';
import Sidebar from './components/Sidebar';
import { meetings } from './mock/sampleMeetings';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import TaskList from './pages/TaskList';

type PageKey = 'home' | 'dashboard' | 'tasks';

function App() {
  const [activePage, setActivePage] = useState<PageKey>('home');
  const [activeMeeting, setActiveMeeting] = useState<string>(meetings[0]?.id ?? '');

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar active={activePage} onSelect={setActivePage} />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {activePage === 'home' && (
          <Home
            meetings={meetings}
            onReviewMeeting={(meetingId) => {
              setActiveMeeting(meetingId);
              setActivePage('dashboard');
            }}
            onViewTasks={() => setActivePage('tasks')}
          />
        )}
        {activePage === 'dashboard' && (
          <Dashboard meetings={meetings} activeMeetingId={activeMeeting} onSelectMeeting={setActiveMeeting} />
        )}
        {activePage === 'tasks' && <TaskList />}
      </main>
    </div>
  );
}

export default App;
