import { useState } from 'react';
import type { Project, ProjectFolder, ProjectFolderType } from '@devsim/shared';
import { api } from '../api';
import { useI18n } from '../i18n';

interface Props {
  projects: Project[];
  taskCounts: Record<string, number>;
  onClose: () => void;
  onRefresh: () => void;
  onSelect: (id: string | null) => void;
  selectedId: string | null;
}

const FOLDER_ICONS: Record<string, string> = {
  frontend: '🖥',
  backend: '⚙',
  docs: '📄',
  config: '🔧',
  other: '📁',
};

interface FolderForm {
  label: string;
  path: string;
  type: ProjectFolderType;
}

const emptyFolder: FolderForm = { label: '', path: '', type: 'frontend' };

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 8px',
  background: '#0f172a',
  border: '1px solid #334155',
  borderRadius: 4,
  color: '#e2e8f0',
  fontSize: 12,
  outline: 'none',
  boxSizing: 'border-box',
};

export function ProjectPanel({ projects, taskCounts, onClose, onRefresh, onSelect, selectedId }: Props) {
  const { t } = useI18n();

  const FOLDER_TYPES: { value: ProjectFolderType; label: string }[] = [
    { value: 'frontend' as ProjectFolderType, label: t.project.folderFrontend },
    { value: 'backend' as ProjectFolderType, label: t.project.folderBackend },
    { value: 'docs' as ProjectFolderType, label: t.project.folderDocs },
    { value: 'config' as ProjectFolderType, label: t.project.folderConfig },
    { value: 'other' as ProjectFolderType, label: t.project.folderOther },
  ];

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folders, setFolders] = useState<FolderForm[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setDescription('');
    setFolders([]);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    const data = {
      name: name.trim(),
      description: description.trim(),
      folders: folders.filter((f) => f.label.trim() && f.path.trim()),
    };
    if (editingId) {
      await api.updateProject(editingId, data);
    } else {
      await api.createProject(data);
    }
    resetForm();
    onRefresh();
  };

  const handleEdit = (p: Project) => {
    setName(p.name);
    setDescription(p.description);
    setFolders(p.folders.map((f) => ({ ...f })));
    setEditingId(p.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    await api.deleteProject(id);
    if (selectedId === id) onSelect(null);
    onRefresh();
  };

  const addFolder = () => setFolders((prev) => [...prev, { ...emptyFolder }]);
  const removeFolder = (i: number) => setFolders((prev) => prev.filter((_, idx) => idx !== i));
  const updateFolder = (i: number, field: keyof FolderForm, value: string) =>
    setFolders((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));

  return (
    <div style={{ width: 300, background: '#1e293b', borderRight: '1px solid #334155', overflowY: 'auto', padding: 12 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 700, fontSize: 14 }}>{t.project.title}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16 }}>x</button>
      </div>

      {/* Add button */}
      <button
        onClick={() => { setShowForm(!showForm); if (showForm) resetForm(); }}
        style={{ width: '100%', padding: '6px 10px', background: '#6366f1', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}
      >
        + {t.project.newProject}
      </button>

      {/* Form */}
      {showForm && (
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8, padding: 10, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
            {editingId ? t.project.editProject : t.project.newProject}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              placeholder={t.project.namePlaceholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={inputStyle}
            />
            <textarea
              placeholder={t.project.descPlaceholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
            />

            {/* Folders */}
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginTop: 4 }}>
              {t.project.folders}
            </div>
            {folders.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <select
                  value={f.type}
                  onChange={(e) => updateFolder(i, 'type', e.target.value)}
                  style={{ ...inputStyle, width: 80, flex: 'none', cursor: 'pointer' }}
                >
                  {FOLDER_TYPES.map((ft) => (
                    <option key={ft.value} value={ft.value}>{ft.label}</option>
                  ))}
                </select>
                <input
                  placeholder={t.project.labelPlaceholder}
                  value={f.label}
                  onChange={(e) => updateFolder(i, 'label', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  placeholder={t.project.pathPlaceholder}
                  value={f.path}
                  onChange={(e) => updateFolder(i, 'path', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <button
                  onClick={() => removeFolder(i)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 14, padding: '0 4px', flexShrink: 0 }}
                >
                  x
                </button>
              </div>
            ))}
            <button
              onClick={addFolder}
              style={{ padding: '4px 8px', background: '#334155', border: 'none', borderRadius: 4, color: '#94a3b8', fontSize: 10, cursor: 'pointer', alignSelf: 'flex-start' }}
            >
              {t.project.addFolder}
            </button>
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
            <button
              onClick={handleSave}
              style={{ flex: 1, padding: '6px', background: '#22c55e', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              {t.common.save}
            </button>
            <button
              onClick={resetForm}
              style={{ flex: 1, padding: '6px', background: '#334155', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* Project list */}
      {projects.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: 20 }}>
          {t.project.emptyState}
        </div>
      )}

      {projects.map((project) => {
        const isExpanded = expandedId === project.id;
        const isSelected = selectedId === project.id;
        const count = taskCounts[project.id] || 0;

        return (
          <div
            key={project.id}
            style={{
              background: isSelected ? '#1e3a5f' : '#0f172a',
              border: `1px solid ${isSelected ? '#3b82f6' : '#334155'}`,
              borderRadius: 8,
              padding: 10,
              marginBottom: 8,
              cursor: 'pointer',
            }}
            onClick={() => onSelect(isSelected ? null : project.id)}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project.name}
              </div>
              <div style={{ fontSize: 9, color: '#64748b', background: '#1e293b', padding: '2px 6px', borderRadius: 4 }}>
                {count} {count === 1 ? t.project.taskCount : t.project.tasksCount}
              </div>
            </div>

            {/* Description preview */}
            {project.description && (
              <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap', maxHeight: isExpanded ? 'none' : 16 }}>
                {project.description}
              </div>
            )}

            {/* Folders */}
            {project.folders.length > 0 && (
              <div style={{ marginTop: 4 }}>
                {(isExpanded ? project.folders : project.folders.slice(0, 2)).map((f, i) => (
                  <div key={i} style={{ fontSize: 9, color: '#64748b', display: 'flex', gap: 4, alignItems: 'center', marginBottom: 2 }}>
                    <span>{FOLDER_ICONS[f.type] || '📁'}</span>
                    <span style={{ color: '#94a3b8' }}>{f.label}</span>
                    <span style={{ color: '#475569' }}>{f.path}</span>
                  </div>
                ))}
                {!isExpanded && project.folders.length > 2 && (
                  <div style={{ fontSize: 9, color: '#475569' }}>+{project.folders.length - 2} {t.project.nMore}</div>
                )}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
              <SmallBtn label={isExpanded ? t.project.less : t.project.more} color="#60a5fa" onClick={() => setExpandedId(isExpanded ? null : project.id)} />
              <SmallBtn label={t.common.edit} color="#f59e0b" onClick={() => handleEdit(project)} />
              <SmallBtn label={t.common.delete} color="#ef4444" onClick={() => handleDelete(project.id)} />
            </div>
          </div>
        );
      })}
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
