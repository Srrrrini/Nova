import { useState } from 'react';

interface FilesToFixProps {
  files: string[];
  meetingTitle?: string;
}

export default function FilesToFix({ files, meetingTitle }: FilesToFixProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (file: string) => {
    navigator.clipboard.writeText(file);
    setCopied(file);
    setTimeout(() => setCopied(null), 2000);
  };

  if (!files || files.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-slate-900">Files & Areas to Fix</h2>
        </div>
        <p className="mt-3 text-sm text-slate-500">No files identified yet. Analyze a meeting to see code areas that need attention.</p>
      </div>
    );
  }

  // Group files by directory
  const filesByDirectory: Record<string, string[]> = {};
  files.forEach((file) => {
    const parts = file.split('/');
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
    if (!filesByDirectory[dir]) {
      filesByDirectory[dir] = [];
    }
    filesByDirectory[dir].push(file);
  });

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 className="text-lg font-semibold text-slate-900">Files & Areas to Fix</h2>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </span>
      </div>
      
      {meetingTitle && (
        <p className="mt-2 text-sm text-slate-500">From: {meetingTitle}</p>
      )}

      <div className="mt-4 space-y-4">
        {Object.entries(filesByDirectory).map(([directory, dirFiles]) => (
          <div key={directory} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex items-center gap-2">
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                {directory}
              </span>
            </div>
            <div className="mt-3 space-y-2">
              {dirFiles.map((file, index) => {
                const fileName = file.split('/').pop() || file;
                return (
                  <div
                    key={`${file}-${index}`}
                    className="group flex items-center justify-between rounded-lg bg-white p-3 transition hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <svg
                        className="h-4 w-4 flex-shrink-0 text-slate-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{fileName}</p>
                        <p className="truncate text-xs text-slate-500">{file}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCopy(file)}
                      className="ml-2 flex-shrink-0 rounded-lg p-2 text-slate-400 opacity-0 transition hover:bg-slate-100 hover:text-slate-600 group-hover:opacity-100"
                      title="Copy path"
                    >
                      {copied === file ? (
                        <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

