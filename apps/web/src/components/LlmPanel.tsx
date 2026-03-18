import { useState } from 'react';
import type { LlmProvider, LlmProviderType } from '@devsim/shared';
import { api } from '../api';
import { useI18n } from '../i18n';

interface Props {
  providers: LlmProvider[];
  onClose: () => void;
  onRefresh: () => void;
}

const DEFAULT_URLS: Record<string, string> = {
  ollama: 'http://localhost:11434',
  lmstudio: 'http://localhost:1234',
  openai: 'https://api.openai.com',
  custom: '',
};

const STATUS_COLORS: Record<string, string> = {
  connected: '#22c55e',
  disconnected: '#ef4444',
  unknown: '#64748b',
};

interface FormData {
  name: string;
  type: LlmProviderType;
  baseUrl: string;
  model: string;
  apiKey: string;
  enabled: boolean;
}

const emptyForm: FormData = {
  name: '',
  type: 'ollama',
  baseUrl: DEFAULT_URLS['ollama'],
  model: '',
  apiKey: '',
  enabled: true,
};

export function LlmPanel({ providers, onClose, onRefresh }: Props) {
  const { t } = useI18n();

  const TYPE_OPTIONS: { value: LlmProviderType; label: string }[] = [
    { value: 'ollama' as LlmProviderType, label: t.llm.typeOllama },
    { value: 'lmstudio' as LlmProviderType, label: t.llm.typeLmStudio },
    { value: 'openai' as LlmProviderType, label: t.llm.typeOpenai },
    { value: 'custom' as LlmProviderType, label: t.llm.typeCustom },
  ];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [testing, setTesting] = useState<string | null>(null);

  const sorted = [...providers].sort((a, b) => a.priority - b.priority);

  const handleTypeChange = (type: LlmProviderType) => {
    setForm((f) => ({ ...f, type, baseUrl: DEFAULT_URLS[type] || f.baseUrl }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.baseUrl.trim() || !form.model.trim()) return;
    const data = {
      name: form.name.trim(),
      type: form.type,
      baseUrl: form.baseUrl.trim(),
      model: form.model.trim(),
      apiKey: form.apiKey.trim() || undefined,
      enabled: form.enabled,
      priority: editingId
        ? providers.find((p) => p.id === editingId)?.priority ?? providers.length
        : providers.length,
    };

    if (editingId) {
      await api.updateLlmProvider(editingId, data);
    } else {
      await api.createLlmProvider(data);
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    onRefresh();
  };

  const handleEdit = (p: LlmProvider) => {
    setForm({
      name: p.name,
      type: p.type,
      baseUrl: p.baseUrl,
      model: p.model,
      apiKey: p.apiKey || '',
      enabled: p.enabled,
    });
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await api.deleteLlmProvider(id);
    onRefresh();
  };

  const handleTest = async (id: string) => {
    setTesting(id);
    await api.checkLlmProviderHealth(id);
    setTesting(null);
    onRefresh();
  };

  const handleTestAll = async () => {
    setTesting('all');
    await api.checkAllLlmHealth();
    setTesting(null);
    onRefresh();
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newOrder = [...sorted];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    await api.reorderLlmProviders(newOrder.map((p) => p.id));
    onRefresh();
  };

  const handleMoveDown = async (index: number) => {
    if (index >= sorted.length - 1) return;
    const newOrder = [...sorted];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    await api.reorderLlmProviders(newOrder.map((p) => p.id));
    onRefresh();
  };

  const handleToggle = async (p: LlmProvider) => {
    await api.updateLlmProvider(p.id, { enabled: !p.enabled });
    onRefresh();
  };

  const inputStyle = {
    width: '100%',
    padding: '6px 8px',
    background: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#e2e8f0',
    fontSize: 12,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };

  return (
    <div
      style={{
        width: 280,
        background: '#1e293b',
        borderRight: '1px solid #334155',
        overflowY: 'auto',
        padding: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{t.llm.title}</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}
        >
          x
        </button>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm); }}
          style={{ flex: 1, padding: '6px 10px', background: '#6366f1', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
        >
          {t.llm.addProvider}
        </button>
        <button
          onClick={handleTestAll}
          disabled={testing === 'all'}
          style={{ padding: '6px 10px', background: '#334155', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', opacity: testing === 'all' ? 0.5 : 1 }}
        >
          {testing === 'all' ? t.llm.testing : t.llm.testAll}
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
            {editingId ? t.llm.editProvider : t.llm.newProvider}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              placeholder={t.llm.namePlaceholder}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              style={inputStyle}
            />

            <select
              value={form.type}
              onChange={(e) => handleTypeChange(e.target.value as LlmProviderType)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <input
              placeholder={t.llm.baseUrlPlaceholder}
              value={form.baseUrl}
              onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value }))}
              style={inputStyle}
            />

            <input
              placeholder={t.llm.modelPlaceholder}
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              style={inputStyle}
            />

            <input
              placeholder={t.llm.apiKeyPlaceholder}
              type="password"
              value={form.apiKey}
              onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
              style={inputStyle}
            />

            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#94a3b8', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
              />
              {t.common.enabled}
            </label>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              onClick={handleSave}
              style={{ flex: 1, padding: '6px', background: '#22c55e', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              {t.common.save}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              style={{ flex: 1, padding: '6px', background: '#334155', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Provider list */}
      {sorted.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: 20 }}>
          {t.llm.emptyState}
        </div>
      )}

      {sorted.map((provider, index) => (
        <div
          key={provider.id}
          style={{
            background: '#0f172a',
            border: `1px solid ${provider.enabled ? '#334155' : '#1e293b'}`,
            borderRadius: 8,
            padding: 10,
            marginBottom: 8,
            opacity: provider.enabled ? 1 : 0.5,
          }}
        >
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: STATUS_COLORS[provider.status] || '#64748b',
                flexShrink: 0,
              }}
            />
            <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {provider.name}
            </div>
            <div style={{ fontSize: 9, color: '#64748b', background: '#1e293b', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>
              #{index + 1}
            </div>
          </div>

          {/* Details */}
          <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>
            {TYPE_OPTIONS.find((o) => o.value === provider.type)?.label} — {provider.model}
          </div>
          <div style={{ fontSize: 9, color: '#475569', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {provider.baseUrl}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 4 }}>
            <SmallBtn
              label={testing === provider.id ? '...' : t.llm.test}
              color="#60a5fa"
              onClick={() => handleTest(provider.id)}
            />
            <SmallBtn label={t.common.edit} color="#f59e0b" onClick={() => handleEdit(provider)} />
            <SmallBtn
              label={provider.enabled ? t.llm.off : t.llm.on}
              color={provider.enabled ? '#94a3b8' : '#22c55e'}
              onClick={() => handleToggle(provider)}
            />
            <SmallBtn label={t.llm.del} color="#ef4444" onClick={() => handleDelete(provider.id)} />
            <div style={{ flex: 1 }} />
            <SmallBtn label="^" color="#64748b" onClick={() => handleMoveUp(index)} />
            <SmallBtn label="v" color="#64748b" onClick={() => handleMoveDown(index)} />
          </div>
        </div>
      ))}
    </div>
  );
}

function SmallBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 6px',
        background: 'transparent',
        border: `1px solid ${color}40`,
        borderRadius: 3,
        color,
        fontSize: 9,
        fontWeight: 600,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = `${color}20`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  );
}
