import { useCallback, useEffect, useId, useState } from 'react';
import type { RawTaskInput } from '../types/project';

interface TaskInputProps {
  onChange: (tasks: RawTaskInput[]) => void;
  disabled?: boolean;
}

const initialText = `Task: Design schema
Owner: Ada
Depends: 
Description: Draft the initial ERD for the unified planning DB.
---
Task: Build frontend
Owner: Grace
Depends: Design schema
Description: Implement dashboard views in React.`;

export default function TaskInput({ onChange, disabled }: TaskInputProps) {
  const textareaId = useId();
  const [rawText, setRawText] = useState(initialText);
  const [error, setError] = useState<string | null>(null);

  const parseFreeform = useCallback((text: string) => {
    const blocks = text.split(/---+/).map((block) => block.trim()).filter(Boolean);
    const parsed: RawTaskInput[] = blocks.map((block, index) => {
      const name = block.match(/Task:\s*(.+)/i)?.[1]?.trim() || `Task ${index + 1}`;
      const owner = block.match(/Owner:\s*(.+)/i)?.[1]?.trim() || 'Unassigned';
      const dependsMatch = block.match(/Depends:\s*(.+)/i);
      const depends = dependsMatch
        ? dependsMatch[1]
            .split(/[,]/)
            .map((d) => d.trim())
            .filter(Boolean)
        : [];
      const description = block.match(/Description:\s*([\s\S]+)/i)?.[1]?.trim() || '';
      return { name, owner, depends_on: depends, description };
    });
    onChange(parsed);
  }, [onChange]);

  useEffect(() => {
    parseFreeform(initialText);
  }, [parseFreeform]);

  const handleTextChange = (value: string) => {
    setRawText(value);
    parseFreeform(value);
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    try {
      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text) as RawTaskInput[];
        onChange(parsed);
        setRawText(JSON.stringify(parsed, null, 2));
      } else if (file.name.endsWith('.csv')) {
        const rows = text.split(/\r?\n/).filter(Boolean);
        const [header, ...rest] = rows;
        const columns = header.split(',').map((c) => c.trim());
        const parsed = rest.map((row) => {
          const values = row.split(',');
          const item: Record<string, string> = {};
          columns.forEach((col, idx) => {
            item[col] = values[idx];
          });
          return {
            name: item.name || item.task,
            description: item.description || '',
            owner: item.owner || 'Unassigned',
            depends_on: item.depends_on ? item.depends_on.split('|').map((d) => d.trim()) : []
          } satisfies RawTaskInput;
        });
        onChange(parsed);
        setRawText(text);
      } else {
        throw new Error('Unsupported file format. Use JSON or CSV.');
      }
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">Task Intake</p>
          <h2 className="text-2xl font-semibold text-slate-900">Upload or paste your backlog</h2>
        </div>
        <label className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:border-slate-400">
          <input
            type="file"
            accept=".json,.csv,application/json,text/csv"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            disabled={disabled}
          />
          Import CSV / JSON
        </label>
      </div>

      <textarea
        id={textareaId}
        className="mt-4 h-56 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 focus:border-slate-400 focus:outline-none"
        value={rawText}
        onChange={(e) => handleTextChange(e.target.value)}
        disabled={disabled}
      />
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
    </div>
  );
}
