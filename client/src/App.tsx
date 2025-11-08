import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import { useMeetingsData } from './hooks/useMeetingsData';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import TaskList from './pages/TaskList';

type PageKey = 'home' | 'dashboard' | 'tasks';

function App() {
  const [activePage, setActivePage] = useState<PageKey>('home');
  const { meetings, tasks, loading, addMeeting } = useMeetingsData();
  const [activeMeeting, setActiveMeeting] = useState<string>('');

  useEffect(() => {
    if (!activeMeeting && meetings.length) {
      setActiveMeeting(meetings[0].id);
    }
  }, [meetings, activeMeeting]);

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
            onMeetingGenerated={(meeting) => {
              addMeeting(meeting);
              setActiveMeeting(meeting.id);
              setActivePage('dashboard');
            }}
            onViewTasks={() => setActivePage('tasks')}
          />
        )}
        {activePage === 'dashboard' && (
          <Dashboard meetings={meetings} activeMeetingId={activeMeeting} onSelectMeeting={setActiveMeeting} />
        )}
        {activePage === 'tasks' && <TaskList tasks={tasks} loading={loading} />}
        {loading && meetings.length === 0 && (
          <div className="p-6 text-sm text-slate-500">Loading meetings…</div>
        )}
      </main>
    </div>
  );
}

export default App;
