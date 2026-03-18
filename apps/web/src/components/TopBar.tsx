import { Company } from '@devsim/shared';

interface Props {
  company: Company;
  running: boolean;
  agentCount: number;
  onToggle: () => void;
  onShowHire: () => void;
  onShowTasks: () => void;
}

export function TopBar({ company, running, agentCount, onToggle, onShowHire, onShowTasks }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        background: '#1e293b',
        borderBottom: '2px solid #334155',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 20, fontWeight: 700 }}>DevSim</span>
        <span style={{ color: '#94a3b8' }}>{company.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Stat label="Budget" value={`$${company.budget.toFixed(0)}`} color="#22c55e" />
        <Stat label="Tick" value={`#${company.tickCount}`} color="#60a5fa" />
        <Stat label="Team" value={`${agentCount}`} color="#a78bfa" />
        <Stat label="Tokens" value={`${company.totalTokensUsed}`} color="#f472b6" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={onShowHire}>Hire</Btn>
        <Btn onClick={onShowTasks}>Tasks</Btn>
        <Btn onClick={onToggle} accent>
          {running ? 'Pause' : 'Play'}
        </Btn>
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, color }}>{value}</div>
    </div>
  );
}

function Btn({ onClick, children, accent }: { onClick: () => void; children: React.ReactNode; accent?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 16px',
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 13,
        background: accent ? '#6366f1' : '#334155',
        color: '#fff',
      }}
    >
      {children}
    </button>
  );
}
