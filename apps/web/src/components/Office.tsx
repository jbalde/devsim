import { useRef, useState } from 'react';
import { Agent, Task, AgentStatus, AGENT_PROFILES } from '@devsim/shared';

interface Props {
  agents: Agent[];
  tasks: Task[];
  onFireAgent: (id: string) => void;
  onMoveAgent: (id: string, x: number, y: number) => void;
}

export function Office({ agents, tasks, onFireAgent, onMoveAgent }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        background: '#0f172a',
        backgroundImage:
          'radial-gradient(circle, #1e293b 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        overflow: 'hidden',
      }}
    >
      {/* Floor grid hint */}
      {agents.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#334155',
            fontSize: 18,
          }}
        >
          Hire agents to populate the office
        </div>
      )}

      {agents.map((agent) => (
        <AgentDesk
          key={agent.id}
          agent={agent}
          task={tasks.find((t) => t.id === agent.currentTaskId)}
          onFire={() => onFireAgent(agent.id)}
          onMove={(x, y) => onMoveAgent(agent.id, x, y)}
          containerRef={containerRef}
        />
      ))}
    </div>
  );
}

function AgentDesk({
  agent,
  task,
  onFire,
  onMove,
  containerRef,
}: {
  agent: Agent;
  task?: Task;
  onFire: () => void;
  onMove: (x: number, y: number) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const profile = AGENT_PROFILES[agent.role];
  const [dragging, setDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const statusColor: Record<AgentStatus, string> = {
    [AgentStatus.IDLE]: '#64748b',
    [AgentStatus.WORKING]: '#22c55e',
    [AgentStatus.TALKING]: '#60a5fa',
    [AgentStatus.BLOCKED]: '#ef4444',
    [AgentStatus.OFFLINE]: '#374151',
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX - agent.position.x;
    const startY = e.clientY - agent.position.y;

    const handleMouseMove = (ev: MouseEvent) => {
      const x = ev.clientX - startX;
      const y = ev.clientY - startY;
      onMove(x, y);
    };

    const handleMouseUp = () => {
      setDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowMenu(!showMenu);
      }}
      style={{
        position: 'absolute',
        left: agent.position.x,
        top: agent.position.y,
        width: 100,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: dragging ? 100 : 1,
      }}
    >
      {/* Desk */}
      <div
        style={{
          background: '#1e293b',
          border: `2px solid ${profile.color}`,
          borderRadius: 8,
          padding: 8,
          textAlign: 'center',
          boxShadow: dragging ? `0 0 20px ${profile.color}40` : 'none',
          transition: 'box-shadow 0.2s',
        }}
      >
        <div style={{ fontSize: 28 }}>{profile.icon}</div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#e2e8f0',
            marginTop: 2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {agent.name}
        </div>
        <div
          style={{
            fontSize: 9,
            color: profile.color,
            textTransform: 'uppercase',
            fontWeight: 600,
          }}
        >
          {profile.label}
        </div>

        {/* Status indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4,
            marginTop: 4,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: statusColor[agent.status],
              animation:
                agent.status === AgentStatus.WORKING
                  ? 'pulse 1s infinite'
                  : undefined,
            }}
          />
          <span style={{ fontSize: 9, color: '#94a3b8' }}>{agent.status}</span>
        </div>

        {/* Current task */}
        {task && (
          <div
            style={{
              marginTop: 4,
              fontSize: 8,
              color: '#64748b',
              background: '#0f172a',
              borderRadius: 4,
              padding: '2px 4px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {task.title}
          </div>
        )}
      </div>

      {/* Context menu */}
      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: 4,
            zIndex: 200,
            minWidth: 80,
          }}
        >
          <div
            onClick={(e) => {
              e.stopPropagation();
              onFire();
              setShowMenu(false);
            }}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              cursor: 'pointer',
              color: '#ef4444',
              borderRadius: 4,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = '#334155')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            Fire
          </div>
        </div>
      )}
    </div>
  );
}
