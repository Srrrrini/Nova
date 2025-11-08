import { useCallback, useEffect, useState } from 'react';
import sampleMeetings from '../mock/sampleMeetings';
import type { MeetingSummary } from '../types/meeting';
import type { TaskNode } from '../types/project';

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
    setLoading(false);
  }, []);

  const addMeeting = useCallback((meeting: MeetingSummary) => {
    setMeetings((prev) => {
      // Check if meeting already exists (by ID), if so update it, otherwise prepend
      const existingIndex = prev.findIndex((m) => m.id === meeting.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = meeting;
        return updated;
      }
      return [meeting, ...prev]; // Prepend new meetings to show at top
    });
    setTasks((prev) => {
      const map = new Map(prev.map((task) => [task.id, task]));
      meeting.tasks.forEach((task) => map.set(task.id, task));
      return Array.from(map.values());
    });
  }, []);

  return { meetings, tasks, loading, error, addMeeting };
}
