import { useRef, useState, useCallback } from 'react';
import { Agent, Task, Squad, AgentStatus, AGENT_PROFILES } from '@devsim/shared';
import { SquadTable } from './SquadTable';
import { useI18n } from '../i18n';

interface Props {
  agents: Agent[];
  tasks: Task[];
  squads: Squad[];
  onFireAgent: (id: string) => void;
  onMoveAgent: (id: string, x: number, y: number) => void;
  onMoveSquad: (id: string, x: number, y: number) => void;
  onDeleteSquad: (id: string) => void;
  onAddToSquad: (agentId: string, squadId: string) => void;
  onRemoveFromSquad: (squadId: string, agentId: string) => void;
}

export function Office({
  agents,
  tasks,
  squads,
  onFireAgent,
  onMoveAgent,
  onMoveSquad,
  onDeleteSquad,
  onAddToSquad,
  onRemoveFromSquad,
}: Props) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Track which agents are in squads
  const agentsInSquads = new Set(squads.flatMap((s) => s.memberIds));
  const freeAgents = agents.filter((a) => !agentsInSquads.has(a.id));

  const handleBgMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return;
      if (e.button !== 0) return;
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };

      const handleMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - panStart.current.x;
        const dy = ev.clientY - panStart.current.y;
        setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
      };

      const handleMouseUp = () => {
        setIsPanning(false);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [pan],
  );

  return (
    <div
      ref={containerRef}
      onMouseDown={handleBgMouseDown}
      style={{
        flex: 1,
        position: 'relative',
        background: '#0f172a',
        overflow: 'hidden',
        cursor: isPanning ? 'grabbing' : 'default',
      }}
    >
      {/* Pannable grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          backgroundImage: 'radial-gradient(circle, #1e293b 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          backgroundPosition: `${pan.x % 24}px ${pan.y % 24}px`,
          width: '200%',
          height: '200%',
          left: '-50%',
          top: '-50%',
          pointerEvents: 'none',
        }}
      />

      {/* Empty state */}
      {agents.length === 0 && squads.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#334155',
            fontSize: 18,
            pointerEvents: 'none',
          }}
        >
          {t.office.emptyState}
        </div>
      )}

      {/* Squad tables */}
      {squads.map((squad) => (
        <SquadTable
          key={squad.id}
          squad={squad}
          members={agents.filter((a) => squad.memberIds.includes(a.id))}
          pan={pan}
          onMoveSquad={(x, y) => onMoveSquad(squad.id, x, y)}
          onDeleteSquad={() => onDeleteSquad(squad.id)}
          onRemoveMember={(agentId) => onRemoveFromSquad(squad.id, agentId)}
        />
      ))}

      {/* Free agents (not in any squad) */}
      {freeAgents.map((agent) => (
        <AgentDesk
          key={agent.id}
          agent={agent}
          task={tasks.find((t) => t.id === agent.currentTaskId)}
          pan={pan}
          squads={squads}
          onFire={() => onFireAgent(agent.id)}
          onMove={(x, y) => onMoveAgent(agent.id, x, y)}
          onAddToSquad={(squadId) => onAddToSquad(agent.id, squadId)}
        />
      ))}

      {/* Pan indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          fontSize: 10,
          color: '#334155',
          pointerEvents: 'none',
        }}
      >
        {Math.round(pan.x)}, {Math.round(pan.y)}
      </div>
    </div>
  );
}

function AgentDesk({
  agent,
  task,
  pan,
  squads,
  onFire,
  onMove,
  onAddToSquad,
}: {
  agent: Agent;
  task?: Task;
  pan: { x: number; y: number };
  squads: Squad[];
  onFire: () => void;
  onMove: (x: number, y: number) => void;
  onAddToSquad: (squadId: string) => void;
}) {
  const { t } = useI18n();
  const profile = AGENT_PROFILES[agent.role];
  const deskRef = useRef<HTMLDivElement>(null);
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
    e.stopPropagation();
    setDragging(true);
    if (deskRef.current) deskRef.current.style.pointerEvents = 'none';
    const startX = e.clientX - agent.position.x;
    const startY = e.clientY - agent.position.y;

    let highlightedSquad: HTMLElement | null = null;

    const handleMouseMove = (ev: MouseEvent) => {
      onMove(ev.clientX - startX, ev.clientY - startY);

      // Highlight squad under cursor
      const elements = document.elementsFromPoint(ev.clientX, ev.clientY);
      let found: HTMLElement | null = null;
      for (const el of elements) {
        const squadEl = (el as HTMLElement).closest('[data-squad-id]') as HTMLElement | null;
        if (squadEl) { found = squadEl; break; }
      }
      if (highlightedSquad && highlightedSquad !== found) {
        highlightedSquad.style.outline = '';
        highlightedSquad.style.outlineOffset = '';
      }
      if (found && found !== highlightedSquad) {
        found.style.outline = '2px solid #22c55e';
        found.style.outlineOffset = '2px';
      }
      highlightedSquad = found;
    };

    const handleMouseUp = (ev: MouseEvent) => {
      setDragging(false);
      if (deskRef.current) deskRef.current.style.pointerEvents = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);

      // Clear highlight
      if (highlightedSquad) {
        highlightedSquad.style.outline = '';
        highlightedSquad.style.outlineOffset = '';
      }

      // Check if dropped over a squad table
      const elements = document.elementsFromPoint(ev.clientX, ev.clientY);
      for (const el of elements) {
        const squadEl = (el as HTMLElement).closest('[data-squad-id]');
        if (squadEl) {
          const squadId = (squadEl as HTMLElement).dataset.squadId;
          if (squadId) {
            onAddToSquad(squadId);
            return;
          }
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      ref={deskRef}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(!showMenu);
      }}
      style={{
        position: 'absolute',
        left: agent.position.x + pan.x,
        top: agent.position.y + pan.y,
        width: 100,
        cursor: dragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        zIndex: dragging ? 100 : 1,
      }}
    >
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
        <div style={{ fontSize: 11, fontWeight: 600, color: '#e2e8f0', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {agent.name}
        </div>
        <div style={{ fontSize: 9, color: profile.color, textTransform: 'uppercase', fontWeight: 600 }}>
          {profile.label}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
          <div
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: statusColor[agent.status],
              animation: agent.status === AgentStatus.WORKING ? 'pulse 1s infinite' : undefined,
            }}
          />
          <span style={{ fontSize: 9, color: '#94a3b8' }}>{agent.status}</span>
        </div>
        {task && (
          <div style={{ marginTop: 4, fontSize: 8, color: '#64748b', background: '#0f172a', borderRadius: 4, padding: '2px 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {task.title}
          </div>
        )}
      </div>

      {/* Context menu with squad options */}
      {showMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 6,
            padding: 4,
            zIndex: 200,
            minWidth: 120,
          }}
        >
          {/* Add to squad options */}
          {squads.length > 0 && (
            <>
              <div style={{ padding: '4px 8px', fontSize: 9, color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>
                {t.office.addToSquad}
              </div>
              {squads.map((squad) => (
                <MenuItem
                  key={squad.id}
                  label={squad.name}
                  color={squad.color}
                  onClick={() => {
                    onAddToSquad(squad.id);
                    setShowMenu(false);
                  }}
                />
              ))}
              <div style={{ borderTop: '1px solid #334155', margin: '4px 0' }} />
            </>
          )}
          <MenuItem label={t.office.fire} color="#ef4444" onClick={() => { onFire(); setShowMenu(false); }} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{ padding: '4px 8px', fontSize: 11, cursor: 'pointer', color, borderRadius: 4 }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </div>
  );
}
