import { useMemo } from 'react';
import ReactFlow, { Background, Controls, Edge, Node } from 'reactflow';
import type { TaskNode } from '../types/project';
import 'reactflow/dist/style.css';

interface DependencyGraphProps {
  tasks: TaskNode[];
}

export default function DependencyGraph({ tasks }: DependencyGraphProps) {
  const nodes = useMemo<Node[]>(() => {
    if (!tasks.length) return [];
    return tasks.map((task, index) => ({
      id: task.id,
      data: { label: `${task.name}\n${task.owner}` },
      position: { x: (index % 3) * 220, y: Math.floor(index / 3) * 140 },
      style: {
        borderRadius: 16,
        padding: 12,
        border: '1px solid #cbd5f5',
        background: '#fff'
      }
    }));
  }, [tasks]);

  const edges = useMemo<Edge[]>(() => {
    return tasks.flatMap((task) =>
      task.depends_on.map((dep) => ({
        id: `${dep}-${task.id}`,
        source: dep,
        target: task.id,
        type: 'smoothstep',
        animated: true
      }))
    );
  }, [tasks]);

  return (
    <div className="h-[420px] w-full rounded-3xl border border-slate-200 bg-white p-2">
      {nodes.length ? (
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background gap={16} color="#e2e8f0" />
          <Controls />
        </ReactFlow>
      ) : (
        <div className="flex h-full items-center justify-center text-slate-400">
          Upload tasks to visualize dependencies.
        </div>
      )}
    </div>
  );
}
