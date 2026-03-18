import { useState } from 'react';
import { Task, Agent, TaskStatus } from '@devsim/shared';

interface Props {
  tasks: Task[];
  agents: Agent[];
  onCreateTask: (title: string, description: string) => void;
  onClose: () => void;
}

const STATUS_COLORS: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: '#64748b',
  [TaskStatus.TODO]: '#f59e0b',
  [TaskStatus.IN_PROGRESS]: '#3b82f6',
  [TaskStatus.IN_REVIEW]: '#a855f7',
  [TaskStatus.DONE]: '#22c55e',
};

export function TaskPanel({ tasks, agents, onCreateTask, onClose }: Props) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onCreateTask(title, desc);
    setTitle('');
    setDesc('');
  };

  return (
    <div
      style={{
        flex: 1,
        borderBottom: '1px solid #1e293b',
        padding: 12,
        overflowY: 'auto',
        maxHeight: '50%',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>Tasks</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
          }}
        >
          x
        </button>
      </div>

      {/* Create task */}
      <div style={{ marginBottom: 12 }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task title..."
          style={{
            width: '100%',
            padding: '6px 8px',
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 4,
            color: '#e2e8f0',
            fontSize: 12,
            marginBottom: 4,
          }}
        />
        <div style={{ display: 'flex', gap: 4 }}>
          <input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Description..."
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 4,
              color: '#e2e8f0',
              fontSize: 12,
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              padding: '6px 12px',
              background: '#6366f1',
              border: 'none',
              borderRadius: 4,
              color: '#fff',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </div>
      </div>

      {/* Task list */}
      {tasks.map((task) => {
        const assignee = agents.find((a) => a.id === task.assigneeId);
        return (
          <div
            key={task.id}
            style={{
              background: '#0f172a',
              borderRadius: 6,
              padding: 8,
              marginBottom: 6,
              borderLeft: `3px solid ${STATUS_COLORS[task.status]}`,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600 }}>{task.title}</div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 4,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: STATUS_COLORS[task.status],
                  textTransform: 'uppercase',
                  fontWeight: 600,
                }}
              >
                {task.status}
              </span>
              {assignee && (
                <span style={{ fontSize: 9, color: '#94a3b8' }}>
                  {assignee.name}
                </span>
              )}
            </div>
            {task.status === TaskStatus.IN_PROGRESS && (
              <div
                style={{
                  marginTop: 4,
                  height: 3,
                  background: '#1e293b',
                  borderRadius: 2,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(100, (task.elapsedTicks / task.estimatedTicks) * 100)}%`,
                    background: '#3b82f6',
                    borderRadius: 2,
                    transition: 'width 0.5s',
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
