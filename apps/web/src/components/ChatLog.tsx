import { useEffect, useRef } from 'react';
import { AgentMessage, Agent, MessageType, AGENT_PROFILES } from '@devsim/shared';

interface Props {
  messages: AgentMessage[];
  agents: Agent[];
}

export function ChatLog({ messages, agents }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const getAgent = (id: string) => agents.find((a) => a.id === id);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          fontSize: 12,
          fontWeight: 700,
          borderBottom: '1px solid #1e293b',
        }}
      >
        Office Chat
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        {messages.map((msg) => {
          const sender = getAgent(msg.fromAgentId);
          const receiver = msg.toAgentId ? getAgent(msg.toAgentId) : null;
          const profile = sender
            ? AGENT_PROFILES[sender.role]
            : null;
          const isSystem = msg.type === MessageType.SYSTEM;

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
                <span
                  style={{
                    color: profile?.color ?? '#94a3b8',
                    fontWeight: 600,
                  }}
                >
                  {sender.name}
                  {receiver && (
                    <span style={{ color: '#475569' }}>
                      {' '}
                      &rarr; {receiver.name}
                    </span>
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
