import { useState, useEffect, useRef, useMemo } from 'react';
import type { AgentMessage, Agent, Squad } from '@devsim/shared';
import { AGENT_PROFILES } from '@devsim/shared';
import { useI18n } from '../i18n';

interface Props {
  messages: AgentMessage[];
  agents: Agent[];
  squads: Squad[];
  onClear: () => void;
}

export function ChatLog({ messages, agents, squads, onClear }: Props) {
  const { t } = useI18n();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [filterAgent, setFilterAgent] = useState<string>('');
  const [filterSquad, setFilterSquad] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter messages
  const filtered = useMemo(() => {
    let result = messages;

    if (filterSquad) {
      const squadMemberIds = new Set(
        squads.find((s) => s.id === filterSquad)?.memberIds ?? [],
      );
      result = result.filter(
        (m) => squadMemberIds.has(m.fromAgentId) || (m.toAgentId && squadMemberIds.has(m.toAgentId)),
      );
    }

    if (filterAgent) {
      result = result.filter(
        (m) => m.fromAgentId === filterAgent || m.toAgentId === filterAgent,
      );
    }

    return result;
  }, [messages, filterAgent, filterSquad, squads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filtered.length]);

  const getAgent = (id: string) => agents.find((a) => a.id === id);

  const hasFilters = filterAgent || filterSquad;

  const selectStyle: React.CSSProperties = {
    padding: '4px 6px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#e2e8f0',
    fontSize: 10,
    outline: 'none',
    cursor: 'pointer',
    flex: 1,
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Header */}
      <div style={{ padding: '8px 12px', fontSize: 12, fontWeight: 700, borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{t.chat.title}</span>
          {hasFilters && (
            <span style={{ fontSize: 9, color: '#6366f1', background: '#6366f120', padding: '1px 6px', borderRadius: 8 }}>
              {t.chat.filtered}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <HeaderBtn
            label={showFilters ? '▼' : '▶'}
            title={t.chat.filters}
            active={showFilters || !!hasFilters}
            onClick={() => setShowFilters(!showFilters)}
          />
          <HeaderBtn
            label="Clear"
            title={t.chat.clearChat}
            active={false}
            onClick={onClear}
          />
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{ padding: '6px 12px', borderBottom: '1px solid #1e293b', display: 'flex', gap: 6, alignItems: 'center', background: '#0f172a' }}>
          <select value={filterSquad} onChange={(e) => { setFilterSquad(e.target.value); setFilterAgent(''); }} style={selectStyle}>
            <option value="">{t.chat.allSquads}</option>
            {squads.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} style={selectStyle}>
            <option value="">{t.chat.allAgents}</option>
            {(filterSquad
              ? agents.filter((a) => squads.find((s) => s.id === filterSquad)?.memberIds.includes(a.id))
              : agents
            ).map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={() => { setFilterAgent(''); setFilterSquad(''); }}
              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 11, padding: '2px 4px', flexShrink: 0 }}
              title={t.chat.clearFilters}
            >
              x
            </button>
          )}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#475569', fontSize: 11, padding: 20 }}>
            {hasFilters ? t.chat.noMessagesFilter : t.chat.noMessages}
          </div>
        )}

        {filtered.map((msg) => {
          const sender = getAgent(msg.fromAgentId);
          const receiver = msg.toAgentId ? getAgent(msg.toAgentId) : null;
          const profile = sender ? AGENT_PROFILES[sender.role] : null;
          const isSystem = msg.type === 'system';

          return (
            <div
              key={msg.id}
              style={{
                fontSize: 11,
                lineHeight: 1.4,
                color: isSystem ? '#64748b' : '#cbd5e1',
                fontStyle: isSystem ? 'italic' : 'normal',
              }}
            >
              {!isSystem && sender && (
                <span style={{ color: profile?.color ?? '#94a3b8', fontWeight: 600 }}>
                  {sender.name}
                  {receiver && (
                    <span style={{ color: '#475569' }}> &rarr; {receiver.name}</span>
                  )}
                  :{' '}
                </span>
              )}
              {msg.content}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function HeaderBtn({ label, title, active, onClick }: { label: string; title: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        padding: '2px 6px',
        background: active ? '#6366f120' : 'transparent',
        border: `1px solid ${active ? '#6366f140' : '#334155'}`,
        borderRadius: 3,
        color: active ? '#6366f1' : '#64748b',
        fontSize: 9,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}
