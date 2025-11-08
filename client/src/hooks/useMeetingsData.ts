import { useCallback, useEffect, useState } from 'react';
import sampleMeetings from '../mock/sampleMeetings';
import type { MeetingSummary } from '../types/meeting';
import type { TaskNode } from '../types/project';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

interface MeetingsResponse {
  meetings: MeetingSummary[];
  tasks: TaskNode[];
}

export function useMeetingsData() {
  const [meetings, setMeetings] = useState<MeetingSummary[]>(sampleMeetings);
  const [tasks, setTasks] = useState<TaskNode[]>(() =>
    Array.from(
      sampleMeetings.reduce((acc, meeting) => {
        meeting.tasks.forEach((task) => acc.set(task.id, task));
        return acc;
      }, new Map<string, TaskNode>()).values()
    )
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchMeetings() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/meetings`);
        if (!res.ok) {
          throw new Error('Failed to load meetings');
        }
        const data = (await res.json()) as MeetingsResponse;
        if (isMounted) {
          setMeetings(data.meetings);
          setTasks(data.tasks);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchMeetings();
    return () => {
      isMounted = false;
    };
  }, []);

  const addMeeting = useCallback((meeting: MeetingSummary) => {
    setMeetings((prev) => [...prev, meeting]);
    setTasks((prev) => {
      const map = new Map(prev.map((task) => [task.id, task]));
      meeting.tasks.forEach((task) => map.set(task.id, task));
      return Array.from(map.values());
    });
  }, []);

  return { meetings, tasks, loading, error, addMeeting };
}
