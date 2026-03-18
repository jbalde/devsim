import { useState } from 'react';
import { AgentRole, AGENT_PROFILES } from '@devsim/shared';
import { useSimulation } from './useSimulation';
import { Office } from './components/Office';
import { HirePanel } from './components/HirePanel';
import { TaskPanel } from './components/TaskPanel';
import { ChatLog } from './components/ChatLog';
import { TopBar } from './components/TopBar';
import { api } from './api';

export function App() {
  const sim = useSimulation();
  const [showHire, setShowHire] = useState(false);
  const [showTasks, setShowTasks] = useState(false);

  if (!sim.company) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <TopBar
        company={sim.company}
        running={sim.running}
        agentCount={sim.agents.length}
        onToggle={sim.toggleSimulation}
        onShowHire={() => setShowHire(!showHire)}
        onShowTasks={() => setShowTasks(!showTasks)}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left: hire panel */}
        {showHire && (
          <HirePanel
            onHire={async (role) => {
              await api.hireAgent(role);
            }}
            onClose={() => setShowHire(false)}
          />
        )}

        {/* Center: office view */}
        <Office
          agents={sim.agents}
          tasks={sim.tasks}
          onFireAgent={async (id) => {
            await api.fireAgent(id);
          }}
          onMoveAgent={async (id, x, y) => {
            await api.updateAgentPosition(id, x, y);
          }}
        />

        {/* Right sidebar */}
        <div style={{ width: 320, display: 'flex', flexDirection: 'column', borderLeft: '1px solid #1e293b' }}>
          {showTasks && (
            <TaskPanel
              tasks={sim.tasks}
              agents={sim.agents}
              onCreateTask={async (title, description) => {
                await api.createTask({ title, description });
              }}
              onClose={() => setShowTasks(false)}
            />
          )}
          <ChatLog messages={sim.messages} agents={sim.agents} />
        </div>
      </div>
    </div>
  );
}
