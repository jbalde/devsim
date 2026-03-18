import { useRef, useState, useEffect } from 'react';
import { Squad, Agent, AGENT_PROFILES } from '@devsim/shared';

interface Props {
  squad: Squad;
  members: Agent[];
  pan: { x: number; y: number };
  onMoveSquad: (x: number, y: number) => void;
  onDeleteSquad: () => void;
  onRemoveMember: (agentId: string) => void;
}

export function SquadTable({ squad, members, pan, onMoveSquad, onDeleteSquad, onRemoveMember }: Props) {
  const [dragging, setDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  // Local drag offset so movement is instant (no server round-trip)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });

  // Clear local drag offset once the server position catches up via WebSocket
  useEffect(() => {
    if (dragOffset && !dragging) {
      setDragOffset(null);
    }
  }, [squad.position.x, squad.position.y]);

  const SEAT_SIZE = 80;
  const PADDING = 16;
  const minWidth = 220;

  const posX = (dragOffset?.x ?? squad.position.x) + pan.x;
  const posY = (dragOffset?.y ?? squad.position.y) + pan.y;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (!target.closest('[data-squad-header]')) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);

    // Use current visual position (dragOffset if set, otherwise server position)
    const currentX = dragOffset?.x ?? squad.position.x;
    const currentY = dragOffset?.y ?? squad.position.y;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: currentX,
      origY: currentY,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      setDragOffset({
        x: dragRef.current.origX + dx,
        y: dragRef.current.origY + dy,
      });
    };

    const handleMouseUp = (ev: MouseEvent) => {
      setDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const finalX = dragRef.current.origX + dx;
      const finalY = dragRef.current.origY + dy;
      // Keep dragOffset visible until WebSocket updates squad.position (useEffect clears it)
      setDragOffset({ x: finalX, y: finalY });
      onMoveSquad(finalX, finalY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      data-squad-id={squad.id}
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(!showMenu);
      }}
      style={{
        position: 'absolute',
        left: posX,
        top: posY,
        minWidth,
        userSelect: 'none',
        zIndex: dragging ? 50 : 0,
      }}
    >
      {/* Table surface */}
      <div
        style={{
          background: `${squad.color}10`,
          border: `2px solid ${squad.color}50`,
          borderRadius: 12,
          padding: PADDING,
          boxShadow: dragging ? `0 0 30px ${squad.color}30` : `0 0 20px ${squad.color}15`,
          transition: dragging ? 'none' : 'box-shadow 0.2s',
        }}
      >
        {/* Header — draggable handle */}
        <div
          data-squad-header="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
            cursor: dragging ? 'grabbing' : 'grab',
            padding: '6px 8px',
            background: `${squad.color}20`,
            borderRadius: 6,
          }}
        >
          <div data-squad-header="true" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              data-squad-header="true"
              style={{ width: 10, height: 10, borderRadius: '50%', background: squad.color }}
            />
            <span
              data-squad-header="true"
              style={{ fontSize: 13, fontWeight: 700, color: squad.color, textTransform: 'uppercase', letterSpacing: 1 }}
            >
              {squad.name}
            </span>
          </div>
          <span data-squad-header="true" style={{ fontSize: 10, color: '#94a3b8' }}>
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {/* Seats grid — max 4 per row so squads grow vertically */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: SEAT_SIZE, maxWidth: 4 * (SEAT_SIZE + 8) - 8 }}>
          {members.map((agent) => {
            const profile = AGENT_PROFILES[agent.role];
            return (
              <div
                key={agent.id}
                style={{
                  width: SEAT_SIZE,
                  background: '#0f172a',
                  border: `1px solid ${profile.color}40`,
                  borderRadius: 6,
                  padding: 6,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: 20 }}>{profile.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {agent.name}
                </div>
                <div style={{ fontSize: 8, color: profile.color }}>{profile.label}</div>
              </div>
            );
          })}

          {/* Empty seat placeholder */}
          <div
            style={{
              width: SEAT_SIZE,
              height: SEAT_SIZE,
              border: `2px dashed ${squad.color}30`,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 9,
              color: '#475569',
              textAlign: 'center',
              padding: 4,
            }}
          >
            Right-click agent to add
          </div>
        </div>
      </div>

      {/* Context menu */}
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
          {members.length > 0 && (
            <>
              <div style={{ padding: '4px 8px', fontSize: 9, color: '#475569', textTransform: 'uppercase', fontWeight: 600 }}>
                Remove member
              </div>
              {members.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => { onRemoveMember(agent.id); setShowMenu(false); }}
                  style={{ padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: '#f59e0b', borderRadius: 4 }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {agent.name}
                </div>
              ))}
              <div style={{ borderTop: '1px solid #334155', margin: '4px 0' }} />
            </>
          )}
          <div
            onClick={() => { onDeleteSquad(); setShowMenu(false); }}
            style={{ padding: '4px 8px', fontSize: 11, cursor: 'pointer', color: '#ef4444', borderRadius: 4 }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#334155')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Delete Squad
          </div>
        </div>
      )}
    </div>
  );
}
