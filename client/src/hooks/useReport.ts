import { useCallback, useState } from 'react';
import type { AnalysisResponse, ReportResponse } from '../types/project';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export function useReport() {
  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateReport = useCallback(async (analysis: AnalysisResponse | null) => {
    if (!analysis) {
      setError('Run an analysis first.');
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis })
      });

      if (!res.ok) {
        throw new Error('Failed to create report');
      }

      const json = (await res.json()) as ReportResponse;
      setData(json);
      return json;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, generateReport };
}
