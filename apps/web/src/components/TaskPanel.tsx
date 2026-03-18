import { useState, useMemo } from 'react';
import type { Task, Agent, Squad, Project } from '@devsim/shared';
import { useI18n } from '../i18n';

interface Props {
  tasks: Task[];
  agents: Agent[];
  squads: Squad[];
  projects: Project[];
  selectedProjectId: string | null;
  onCreateTask: (title: string, description: string, type: string, epicId: string | null, projectId: string | null, squadId: string | null) => Promise<void>;
  onUpdateTask: (id: string, data: Record<string, unknown>) => void;
  onDeleteTask: (id: string) => void;
  onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  backlog: '#64748b',
  todo: '#f59e0b',
  in_progress: '#3b82f6',
  in_review: '#a855f7',
  done: '#22c55e',
};

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

type View = 'list' | 'create' | 'detail';
const TASK_TYPE_TASK = 'task';
const TASK_TYPE_EPIC = 'epic';

export function TaskPanel({ tasks, agents, squads, projects, selectedProjectId, onCreateTask, onUpdateTask, onDeleteTask, onClose }: Props) {
  const { t } = useI18n();

  const STATUS_OPTIONS: { value: string; label: string }[] = [
    { value: 'backlog', label: t.task.statusBacklog },
    { value: 'todo', label: t.task.statusTodo },
    { value: 'in_progress', label: t.task.statusInProgress },
    { value: 'in_review', label: t.task.statusInReview },
    { value: 'done', label: t.task.statusDone },
  ];

  const PRIORITY_OPTIONS = [
    { value: 'low', label: t.task.priorityLow, color: '#64748b' },
    { value: 'medium', label: t.task.priorityMedium, color: '#f59e0b' },
    { value: 'high', label: t.task.priorityHigh, color: '#f97316' },
    { value: 'critical', label: t.task.priorityCritical, color: '#ef4444' },
  ];

  const [view, setView] = useState<View>('list');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Create form state
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [taskType, setTaskType] = useState<string>(TASK_TYPE_TASK);
  const [epicId, setEpicId] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [squadId, setSquadId] = useState<string>('');

  // Edit form state
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<string>(TASK_TYPE_TASK);
  const [editEpicId, setEditEpicId] = useState<string>('');
  const [editStatus, setEditStatus] = useState<string>('');
  const [editPriority, setEditPriority] = useState<string>('');
  const [editProjectId, setEditProjectId] = useState<string>('');
  const [editSquadId, setEditSquadId] = useState<string>('');

  const effectiveProjectId = projectId || selectedProjectId || '';

  const filteredTasks = useMemo(() => {
    if (selectedProjectId) {
      return tasks.filter((t) => t.projectId === selectedProjectId);
    }
    return tasks;
  }, [tasks, selectedProjectId]);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);
  const availableEpics = useMemo(() => {
    const projectScope = selectedProjectId || effectiveProjectId || '';
    return tasks.filter((task) =>
      (task.type ?? TASK_TYPE_TASK) === TASK_TYPE_EPIC &&
      (!projectScope || task.projectId === projectScope),
    );
  }, [tasks, selectedProjectId, effectiveProjectId]);

  const selectedProjectName = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId)?.name
    : null;

  // --- Handlers ---
  const handleCreate = async () => {
    if (!title.trim()) return;
    await onCreateTask(
      title.trim(),
      desc.trim(),
      taskType,
      taskType === TASK_TYPE_TASK ? epicId || null : null,
      effectiveProjectId || null,
      squadId || null,
    );
    setTitle('');
    setDesc('');
    setTaskType(TASK_TYPE_TASK);
    setEpicId('');
    setProjectId('');
    setSquadId('');
    setView('list');
  };

  const openCreate = (type: string) => {
    setTaskType(type);
    if (type === TASK_TYPE_EPIC) {
      setEpicId('');
    }
    setView('create');
  };

  const openDetail = (task: Task) => {
    setSelectedTaskId(task.id);
    setEditing(false);
    setView('detail');
  };

  const startEdit = (task: Task) => {
    setEditTitle(task.title);
    setEditDesc(task.description);
    setEditType(task.type);
    setEditEpicId(task.epicId || '');
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditProjectId(task.projectId || '');
    setEditSquadId(task.squadId || '');
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTaskId || !editTitle.trim()) return;
    await onUpdateTask(selectedTaskId, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      type: editType,
      epicId: editType === TASK_TYPE_TASK ? editEpicId || null : null,
      status: editStatus,
      priority: editPriority,
      projectId: editProjectId || null,
      squadId: editSquadId || null,
    });
    setEditing(false);
  };

  const handleDelete = async (id: string) => {
    setView('list');
    setSelectedTaskId(null);
    await onDeleteTask(id);
  };

  // --- Render ---
  return (
    <div style={{ flex: 1, borderBottom: '1px solid #1e293b', padding: 12, overflowY: 'auto', maxHeight: '50%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {view !== 'list' && (
            <button
              onClick={() => { setView('list'); setEditing(false); }}
              style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 14, padding: 0 }}
            >
              &larr;
            </button>
          )}
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            {view === 'list' ? t.task.title : view === 'create' ? (taskType === TASK_TYPE_EPIC ? t.task.newEpic : t.task.newTask) : t.task.taskDetail}
          </span>
          {view === 'list' && selectedProjectName && (
            <span style={{ fontSize: 10, color: '#6366f1' }}>{selectedProjectName}</span>
          )}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>x</button>
      </div>

      {/* ========== LIST VIEW ========== */}
      {view === 'list' && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <button
              onClick={() => openCreate(TASK_TYPE_TASK)}
              style={{ flex: 1, padding: '6px 10px', background: '#6366f1', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              + {t.task.newTask}
            </button>
            <button
              onClick={() => openCreate(TASK_TYPE_EPIC)}
              style={{ flex: 1, padding: '6px 10px', background: '#7c3aed', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
            >
              + {t.task.newEpic}
            </button>
          </div>

          {filteredTasks.length === 0 && (
            <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: 20 }}>
              {selectedProjectId ? t.task.noTasksProject : t.task.noTasks}
            </div>
          )}

          {filteredTasks.map((task) => {
            const assignee = agents.find((a) => a.id === task.assigneeId);
            const squad = squads.find((s) => s.id === task.squadId);
            const project = projects.find((p) => p.id === task.projectId);
            const epic = tasks.find((candidate) => candidate.id === task.epicId);
            const prioInfo = PRIORITY_OPTIONS.find((o) => o.value === task.priority);
            const taskTypeValue = task.type ?? TASK_TYPE_TASK;

            return (
              <div
                key={task.id}
                onClick={() => openDetail(task)}
                style={{
                  background: '#0f172a',
                  borderRadius: 6,
                  padding: 8,
                  marginBottom: 6,
                  borderLeft: `3px solid ${STATUS_COLORS[task.status] || '#64748b'}`,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1e293b')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#0f172a')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.title}
                  </div>
                  <span style={{ fontSize: 8, color: taskTypeValue === TASK_TYPE_EPIC ? '#c084fc' : '#38bdf8', border: `1px solid ${taskTypeValue === TASK_TYPE_EPIC ? '#c084fc40' : '#38bdf840'}`, padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>
                    {taskTypeValue === TASK_TYPE_EPIC ? t.task.typeEpic : t.task.typeTask}
                  </span>
                  {prioInfo && (
                    <span style={{ fontSize: 8, color: prioInfo.color, border: `1px solid ${prioInfo.color}40`, padding: '1px 4px', borderRadius: 3, flexShrink: 0 }}>
                      {prioInfo.label}
                    </span>
                  )}
                </div>

                {task.description && (
                  <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {task.description}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', gap: 4 }}>
                  <span style={{ fontSize: 9, color: STATUS_COLORS[task.status] || '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                    {task.status.replace('_', ' ')}
                  </span>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                    {project && !selectedProjectId && (
                      <span style={{ fontSize: 8, color: '#6366f1', background: '#6366f120', padding: '1px 4px', borderRadius: 3 }}>
                        {project.name}
                      </span>
                    )}
                    {epic && (
                      <span style={{ fontSize: 8, color: '#c084fc', background: '#c084fc20', padding: '1px 4px', borderRadius: 3 }}>
                        {epic.title}
                      </span>
                    )}
                    {squad && (
                      <span style={{ fontSize: 8, color: squad.color, background: `${squad.color}20`, padding: '1px 4px', borderRadius: 3 }}>
                        {squad.name}
                      </span>
                    )}
                    {assignee && (
                      <span style={{ fontSize: 9, color: '#94a3b8' }}>{assignee.name}</span>
                    )}
                  </div>
                </div>

                {task.status === 'in_progress' && (
                  <div style={{ marginTop: 4, height: 3, background: '#1e293b', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (task.elapsedTicks / task.estimatedTicks) * 100)}%`, background: '#3b82f6', borderRadius: 2, transition: 'width 0.5s' }} />
                  </div>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ========== CREATE VIEW ========== */}
      {view === 'create' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.task.titlePlaceholder}
            style={inputStyle}
            autoFocus
          />
          <select
            value={taskType}
            onChange={(e) => {
              const nextType = e.target.value;
              setTaskType(nextType);
              if (nextType === TASK_TYPE_EPIC) setEpicId('');
            }}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value={TASK_TYPE_TASK}>{t.task.typeTask}</option>
            <option value={TASK_TYPE_EPIC}>{t.task.typeEpic}</option>
          </select>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder={t.task.descPlaceholder}
            rows={5}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
          />
          <select
            value={epicId}
            onChange={(e) => setEpicId(e.target.value)}
            disabled={taskType !== TASK_TYPE_TASK}
            style={{ ...inputStyle, cursor: taskType === TASK_TYPE_TASK ? 'pointer' : 'not-allowed', opacity: taskType === TASK_TYPE_TASK ? 1 : 0.5 }}
          >
            <option value="">{t.task.noEpic}</option>
            {availableEpics.map((epic) => (
              <option key={epic.id} value={epic.id}>{epic.title}</option>
            ))}
          </select>
          <select
            value={effectiveProjectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">{t.task.noProject}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <select
            value={squadId}
            onChange={(e) => setSquadId(e.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
          >
            <option value="">{t.task.noSquad}</option>
            {squads.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <button onClick={handleCreate} style={{ flex: 1, padding: '6px', background: '#22c55e', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {t.common.create}
            </button>
            <button onClick={() => setView('list')} style={{ flex: 1, padding: '6px', background: '#334155', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      {/* ========== DETAIL VIEW ========== */}
      {view === 'detail' && selectedTask && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!editing ? (
            <>
              {/* Read-only detail */}
              <DetailSection label={t.task.labelTitle}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{selectedTask.title}</div>
              </DetailSection>

              {(() => {
                const selectedTaskType = selectedTask.type ?? TASK_TYPE_TASK;
                return (
              <DetailSection label={t.task.labelType}>
                <span style={{ fontSize: 12, color: selectedTaskType === TASK_TYPE_EPIC ? '#c084fc' : '#38bdf8', fontWeight: 600 }}>
                  {selectedTaskType === TASK_TYPE_EPIC ? t.task.typeEpic : t.task.typeTask}
                </span>
              </DetailSection>
                );
              })()}

              <DetailSection label={t.task.labelEpic}>
                {(() => {
                  const epic = tasks.find((task) => task.id === selectedTask.epicId);
                  return <span style={{ fontSize: 11, color: epic ? '#c084fc' : '#475569' }}>{epic?.title || t.task.noEpic}</span>;
                })()}
              </DetailSection>

              <DetailSection label={t.task.labelStatus}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[selectedTask.status] || '#64748b' }} />
                  <span style={{ fontSize: 12, color: STATUS_COLORS[selectedTask.status], textTransform: 'uppercase', fontWeight: 600 }}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                </div>
              </DetailSection>

              <DetailSection label={t.task.labelPriority}>
                {(() => {
                  const p = PRIORITY_OPTIONS.find((o) => o.value === selectedTask.priority);
                  return <span style={{ fontSize: 12, color: p?.color || '#94a3b8', fontWeight: 600 }}>{p?.label || selectedTask.priority}</span>;
                })()}
              </DetailSection>

              <DetailSection label={t.task.labelDescription}>
                <div style={{ fontSize: 11, color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto' }}>
                  {selectedTask.description || t.task.emptyDesc}
                </div>
              </DetailSection>

              <DetailSection label={t.task.labelProject}>
                {(() => {
                  const proj = projects.find((p) => p.id === selectedTask.projectId);
                  return <span style={{ fontSize: 11, color: proj ? '#6366f1' : '#475569' }}>{proj?.name || t.common.none}</span>;
                })()}
              </DetailSection>

              <DetailSection label={t.task.labelSquad}>
                {(() => {
                  const sq = squads.find((s) => s.id === selectedTask.squadId);
                  return <span style={{ fontSize: 11, color: sq ? sq.color : '#475569' }}>{sq?.name || t.common.none}</span>;
                })()}
              </DetailSection>

              <DetailSection label={t.task.labelAssignee}>
                {(() => {
                  const ag = agents.find((a) => a.id === selectedTask.assigneeId);
                  return <span style={{ fontSize: 11, color: ag ? '#e2e8f0' : '#475569' }}>{ag?.name || t.task.unassigned}</span>;
                })()}
              </DetailSection>

              {(selectedTask.type ?? TASK_TYPE_TASK) === TASK_TYPE_TASK && (
                <DetailSection label={t.task.labelProgress}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: '#1e293b', borderRadius: 2 }}>
                      <div style={{ height: '100%', width: `${Math.min(100, selectedTask.estimatedTicks > 0 ? (selectedTask.elapsedTicks / selectedTask.estimatedTicks) * 100 : 0)}%`, background: '#3b82f6', borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 10, color: '#64748b', flexShrink: 0 }}>
                      {selectedTask.elapsedTicks}/{selectedTask.estimatedTicks} {t.task.ticks}
                    </span>
                  </div>
                </DetailSection>
              )}

              <DetailSection label={t.task.labelCreated}>
                <span style={{ fontSize: 10, color: '#64748b' }}>
                  {new Date(selectedTask.createdAt).toLocaleString()}
                </span>
              </DetailSection>

              {selectedTask.completedAt && (
                <DetailSection label={t.task.labelCompleted}>
                  <span style={{ fontSize: 10, color: '#22c55e' }}>
                    {new Date(selectedTask.completedAt).toLocaleString()}
                  </span>
                </DetailSection>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  onClick={() => startEdit(selectedTask)}
                  style={{ flex: 1, padding: '6px', background: '#f59e0b', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  {t.common.edit}
                </button>
                <button
                  onClick={() => handleDelete(selectedTask.id)}
                  style={{ flex: 1, padding: '6px', background: '#ef4444', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  {t.common.delete}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Edit form */}
              <div style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b', marginBottom: 2 }}>{t.task.editing}</div>

              <label style={{ fontSize: 10, color: '#94a3b8' }}>{t.task.labelTitle}</label>
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={inputStyle}
              />

              <label style={{ fontSize: 10, color: '#94a3b8' }}>{t.task.labelType}</label>
              <select
                value={editType}
                onChange={(e) => {
                  const nextType = e.target.value;
                  setEditType(nextType);
                  if (nextType === TASK_TYPE_EPIC) setEditEpicId('');
                }}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value={TASK_TYPE_TASK}>{t.task.typeTask}</option>
                <option value={TASK_TYPE_EPIC}>{t.task.typeEpic}</option>
              </select>

              <label style={{ fontSize: 10, color: '#94a3b8' }}>{t.task.labelDescription}</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={5}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
              />

              <label style={{ fontSize: 10, color: '#94a3b8' }}>{t.task.labelEpic}</label>
              <select
                value={editEpicId}
                onChange={(e) => setEditEpicId(e.target.value)}
                disabled={editType !== TASK_TYPE_TASK}
                style={{ ...inputStyle, cursor: editType === TASK_TYPE_TASK ? 'pointer' : 'not-allowed', opacity: editType === TASK_TYPE_TASK ? 1 : 0.5 }}
              >
                <option value="">{t.task.noEpic}</option>
                {tasks
                  .filter((task) =>
                    (task.type ?? TASK_TYPE_TASK) === TASK_TYPE_EPIC &&
                    task.id !== selectedTaskId &&
                    (!editProjectId || task.projectId === editProjectId),
                  )
                  .map((epic) => (
                    <option key={epic.id} value={epic.id}>{epic.title}</option>
                  ))}
              </select>

              <label style={{ fontSize: 10, color: '#94a3b8' }}>{t.task.labelStatus}</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <label style={{ fontSize: 10, color: '#94a3b8' }}>{t.task.labelPriority}</label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <label style={{ fontSize: 10, color: '#94a3b8' }}>{t.task.labelProject}</label>
              <select
                value={editProjectId}
                onChange={(e) => setEditProjectId(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">{t.task.noProject}</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <label style={{ fontSize: 10, color: '#94a3b8' }}>{t.task.labelSquad}</label>
              <select
                value={editSquadId}
                onChange={(e) => setEditSquadId(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="">{t.task.noSquad}</option>
                {squads.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                  onClick={handleSaveEdit}
                  style={{ flex: 1, padding: '6px', background: '#22c55e', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  {t.common.save}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{ flex: 1, padding: '6px', background: '#334155', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                >
                  {t.common.cancel}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Task was deleted while viewing detail */}
      {view === 'detail' && !selectedTask && (
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 12, padding: 20 }}>
          {t.task.taskNotFound}
          <button
            onClick={() => setView('list')}
            style={{ display: 'block', margin: '8px auto', background: '#334155', border: 'none', borderRadius: 4, color: '#fff', fontSize: 11, padding: '6px 12px', cursor: 'pointer' }}
          >
            {t.task.backToList}
          </button>
        </div>
      )}
    </div>
  );
}

function DetailSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      {children}
    </div>
  );
}
