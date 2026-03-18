import { useState, useCallback, useMemo } from 'react';
import { AgentRole } from '@devsim/shared';
import { useSimulation } from './useSimulation';
import { Office } from './components/Office';
import { HirePanel } from './components/HirePanel';
import { TaskPanel } from './components/TaskPanel';
import { ChatLog } from './components/ChatLog';
import { TopBar } from './components/TopBar';
import { LlmPanel } from './components/LlmPanel';
import { ProjectPanel } from './components/ProjectPanel';
import { api } from './api';
import { useI18n } from './i18n';

export function App() {
  const { t } = useI18n();
  const sim = useSimulation();
  const [showHire, setShowHire] = useState(false);
  const [showTasks, setShowTasks] = useState(false);
  const [showLlm, setShowLlm] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Count tasks per project
  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of sim.tasks) {
      if (t.projectId) {
        counts[t.projectId] = (counts[t.projectId] || 0) + 1;
      }
    }
    return counts;
  }, [sim.tasks]);

  const handleAutoLayout = useCallback(async () => {
    const DESK_W = 120;
    const DESK_H = 140;
    const PADDING = 20;

    // Layout free agents (not in squads)
    const agentsInSquads = new Set(sim.squads.flatMap((s) => s.memberIds));
    const freeAgents = sim.agents.filter((a) => !agentsInSquads.has(a.id));
    const COLS = Math.max(3, Math.ceil(Math.sqrt(freeAgents.length)));

    const sorted = [...freeAgents].sort((a, b) => {
      const managerRoles: string[] = [AgentRole.PRODUCT_MANAGER, AgentRole.PROJECT_MANAGER];
      const aIsManager = managerRoles.includes(a.role) ? 0 : 1;
      const bIsManager = managerRoles.includes(b.role) ? 0 : 1;
      if (aIsManager !== bIsManager) return aIsManager - bIsManager;
      if (a.role !== b.role) return a.role.localeCompare(b.role);
      return a.name.localeCompare(b.name);
    });

    for (let i = 0; i < sorted.length; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const x = PADDING + col * (DESK_W + PADDING);
      const y = PADDING + row * (DESK_H + PADDING);
      await api.updateAgentPosition(sorted[i].id, x, y);
    }

    // Layout squads below free agents
    const SQUAD_GAP = 30;
    const freeRows = Math.ceil(sorted.length / COLS);
    const squadsStartY = PADDING + freeRows * (DESK_H + PADDING) + SQUAD_GAP;

    const SEAT = 80;
    const GAP = 8;
    const TABLE_PAD = 16;
    const MAX_SEATS_PER_ROW = 4;

    let cursorX = PADDING;
    let cursorY = squadsStartY;
    let rowMaxH = 0;
    const MAX_ROW_W = COLS * (DESK_W + PADDING);

    for (let i = 0; i < sim.squads.length; i++) {
      const memberCount = sim.squads[i].memberIds.length + 1;
      const seatsPerRow = Math.min(memberCount, MAX_SEATS_PER_ROW);
      const rows = Math.ceil(memberCount / MAX_SEATS_PER_ROW);
      const squadW = seatsPerRow * (SEAT + GAP) - GAP + TABLE_PAD * 2;
      const squadH = rows * (SEAT + GAP) - GAP + TABLE_PAD * 2 + 40;

      if (cursorX + squadW > MAX_ROW_W + PADDING && cursorX > PADDING) {
        cursorX = PADDING;
        cursorY += rowMaxH + SQUAD_GAP;
        rowMaxH = 0;
      }

      await sim.moveSquad(sim.squads[i].id, cursorX, cursorY);
      cursorX += squadW + SQUAD_GAP;
      rowMaxH = Math.max(rowMaxH, squadH);
    }
  }, [sim.agents, sim.squads, sim.moveSquad]);

  const handleCreateSquad = useCallback(async () => {
    const name = prompt(t.topBar.squadNamePrompt);
    if (!name?.trim()) return;
    await sim.createSquad(name.trim());
  }, [sim.createSquad, t]);

  if (!sim.company) return <div style={{ padding: 40, textAlign: 'center' }}>{t.common.loading}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar
        company={sim.company}
        running={sim.running}
        agentCount={sim.agents.length}
        onToggle={sim.toggleSimulation}
        onShowHire={() => setShowHire(!showHire)}
        onShowTasks={() => setShowTasks(!showTasks)}
        onAutoLayout={handleAutoLayout}
        onCreateSquad={handleCreateSquad}
        onShowLlm={() => setShowLlm(!showLlm)}
        onShowProjects={() => setShowProjects(!showProjects)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {showProjects && (
          <ProjectPanel
            projects={sim.projects}
            taskCounts={taskCounts}
            onClose={() => setShowProjects(false)}
            onRefresh={sim.refresh}
            onSelect={setSelectedProjectId}
            selectedId={selectedProjectId}
          />
        )}

        {showLlm && (
          <LlmPanel
            providers={sim.providers}
            onClose={() => setShowLlm(false)}
            onRefresh={sim.refreshProviders}
          />
        )}

        {showHire && (
          <HirePanel
            onHire={async (role) => {
              await api.hireAgent(role);
              await sim.refresh();
            }}
            onClose={() => setShowHire(false)}
          />
        )}

        <Office
          agents={sim.agents}
          tasks={sim.tasks}
          squads={sim.squads}
          onFireAgent={async (id) => {
            await api.fireAgent(id);
            await sim.refresh();
          }}
          onMoveAgent={async (id, x, y) => {
            await api.updateAgentPosition(id, x, y);
          }}
          onMoveSquad={(id, x, y) => sim.moveSquad(id, x, y)}
          onDeleteSquad={async (id) => {
            await api.deleteSquad(id);
            await sim.refresh();
          }}
          onAddToSquad={(agentId, squadId) => sim.addToSquad(agentId, squadId)}
          onRemoveFromSquad={(squadId, agentId) => sim.removeFromSquad(squadId, agentId)}
        />

        <div style={{ width: 320, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #1e293b' }}>
          {showTasks && (
            <TaskPanel
              tasks={sim.tasks}
              agents={sim.agents}
              squads={sim.squads}
              projects={sim.projects}
              selectedProjectId={selectedProjectId}
              onCreateTask={async (title, description, projectId, squadId) => {
                await api.createTask({ title, description, projectId: projectId ?? undefined, squadId: squadId ?? undefined });
              }}
              onUpdateTask={(id, data) => sim.updateTask(id, data)}
              onDeleteTask={(id) => sim.deleteTask(id)}
              onClose={() => setShowTasks(false)}
            />
          )}
          <ChatLog messages={sim.messages} agents={sim.agents} squads={sim.squads} onClear={sim.clearMessages} />
        </div>
      </div>
    </div>
  );
}
