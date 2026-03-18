import { Company } from '@devsim/shared';
import { useI18n } from '../i18n';

interface Props {
  company: Company;
  running: boolean;
  agentCount: number;
  onToggle: () => void;
  onShowHire: () => void;
  onShowTasks: () => void;
  onAutoLayout: () => void;
  onCreateSquad: () => void;
  onShowLlm: () => void;
  onShowProjects: () => void;
}

export function TopBar({ company, running, agentCount, onToggle, onShowHire, onShowTasks, onAutoLayout, onCreateSquad, onShowLlm, onShowProjects }: Props) {
  const { t, locale, setLocale } = useI18n();
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
        <span style={{ fontSize: 20, fontWeight: 700 }}>{t.topBar.title}</span>
        <span style={{ color: '#94a3b8' }}>{company.name}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Stat label={t.topBar.budget} value={`$${company.budget.toFixed(0)}`} color="#22c55e" />
        <Stat label={t.topBar.tick} value={`#${company.tickCount}`} color="#60a5fa" />
        <Stat label={t.topBar.team} value={`${agentCount}`} color="#a78bfa" />
        <Stat label={t.topBar.tokens} value={`${company.totalTokensUsed}`} color="#f472b6" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Btn onClick={onShowLlm}>{t.topBar.llm}</Btn>
        <Btn onClick={onShowProjects}>{t.topBar.projects}</Btn>
        <Btn onClick={onShowHire}>{t.topBar.hire}</Btn>
        <Btn onClick={onShowTasks}>{t.topBar.tasks}</Btn>
        <Btn onClick={onAutoLayout}>{t.topBar.autolayout}</Btn>
        <Btn onClick={onCreateSquad}>{t.topBar.addSquad}</Btn>
        <Btn onClick={onToggle} accent>
          {running ? t.topBar.pause : t.topBar.play}
        </Btn>
        <Btn onClick={() => setLocale(locale === 'en' ? 'es' : 'en')}>
          {locale.toUpperCase()}
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
