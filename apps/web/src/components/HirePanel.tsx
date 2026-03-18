import { AgentRole, AGENT_PROFILES } from '@devsim/shared';

interface Props {
  onHire: (role: AgentRole) => void;
  onClose: () => void;
}

export function HirePanel({ onHire, onClose }: Props) {
  const roles = Object.values(AgentRole);

  return (
    <div
      style={{
        width: 240,
        background: '#1e293b',
        borderRight: '1px solid #334155',
        overflowY: 'auto',
        padding: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>Hire Agents</span>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: 16,
          }}
        >
          x
        </button>
      </div>

      {roles.map((role) => {
        const p = AGENT_PROFILES[role];
        return (
          <div
            key={role}
            onClick={() => onHire(role)}
            style={{
              background: '#0f172a',
              border: `1px solid ${p.color}30`,
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
              cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = p.color)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = `${p.color}30`)
            }
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{p.label}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>
                  ${p.costPerTick}/tick
                </div>
              </div>
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
              {p.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}
