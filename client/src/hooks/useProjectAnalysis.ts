import { useCallback, useState } from 'react';
import type { AnalysisResponse, RawTaskInput } from '../types/project';
import sampleTasks from '../mock/sampleResponse';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function useProjectAnalysis() {
  const [data, setData] = useState<AnalysisResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (tasks: RawTaskInput[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks })
      });

      if (!res.ok) {
        throw new Error('Failed to analyze project');
      }

      const json = (await res.json()) as AnalysisResponse;
      setData(json);
      return json;
    } catch (err) {
      console.warn('Falling back to mock analysis', err);
      setError((err as Error).message);
      setData(sampleTasks);
      return sampleTasks;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, loading, error, analyze, reset };
}
