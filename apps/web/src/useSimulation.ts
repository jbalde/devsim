import { useState, useEffect, useCallback } from 'react';
import { Agent, AgentMessage, Task, Company, Squad, WsEvent } from '@devsim/shared';
import { socket } from './socket';
import { api } from './api';

export function useSimulation() {
  const [company, setCompany] = useState<Company | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [running, setRunning] = useState(false);

  // Initial load
  useEffect(() => {
    Promise.all([
      api.getCompany(),
      api.getAgents(),
      api.getTasks(),
      api.getMessages(),
      api.getSimulationStatus(),
      api.getSquads(),
    ]).then(([c, a, t, m, s, sq]) => {
      setCompany(c as Company);
      setAgents(a as Agent[]);
      setTasks(t as Task[]);
      setMessages(m as AgentMessage[]);
      setRunning((s as { running: boolean }).running);
      setSquads(sq as Squad[]);
    });
  }, []);

  // WebSocket listeners
  useEffect(() => {
    socket.on(WsEvent.COMPANY_UPDATED, (c: Company) => setCompany(c));

    socket.on(WsEvent.AGENT_HIRED, (a: Agent) =>
      setAgents((prev) => [...prev, a]),
    );
    socket.on(WsEvent.AGENT_UPDATED, (a: Agent) =>
      setAgents((prev) => prev.map((x) => (x.id === a.id ? a : x))),
    );
    socket.on(WsEvent.AGENT_FIRED, ({ id }: { id: string }) =>
      setAgents((prev) => prev.filter((x) => x.id !== id)),
    );

    socket.on(WsEvent.TASK_CREATED, (t: Task) =>
      setTasks((prev) => [...prev, t]),
    );
    socket.on(WsEvent.TASK_UPDATED, (t: Task) =>
      setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x))),
    );

    socket.on(WsEvent.MESSAGE_SENT, (m: AgentMessage) =>
      setMessages((prev) => [...prev.slice(-99), m]),
    );

    socket.on(WsEvent.SQUAD_CREATED, (sq: Squad) =>
      setSquads((prev) => [...prev, sq]),
    );
    socket.on(WsEvent.SQUAD_UPDATED, (sq: Squad) =>
      setSquads((prev) => prev.map((x) => (x.id === sq.id ? sq : x))),
    );
    socket.on(WsEvent.SQUAD_DELETED, ({ id }: { id: string }) =>
      setSquads((prev) => prev.filter((x) => x.id !== id)),
    );

    return () => {
      socket.off(WsEvent.COMPANY_UPDATED);
      socket.off(WsEvent.AGENT_HIRED);
      socket.off(WsEvent.AGENT_UPDATED);
      socket.off(WsEvent.AGENT_FIRED);
      socket.off(WsEvent.TASK_CREATED);
      socket.off(WsEvent.TASK_UPDATED);
      socket.off(WsEvent.MESSAGE_SENT);
      socket.off(WsEvent.SQUAD_CREATED);
      socket.off(WsEvent.SQUAD_UPDATED);
      socket.off(WsEvent.SQUAD_DELETED);
    };
  }, []);

  const toggleSimulation = useCallback(async () => {
    if (running) {
      await api.stopSimulation();
      setRunning(false);
    } else {
      await api.startSimulation();
      setRunning(true);
    }
  }, [running]);

  const addToSquad = useCallback(async (agentId: string, squadId: string) => {
    // Optimistic update: move agent into squad immediately
    setSquads((prev) =>
      prev.map((s) => {
        if (s.id === squadId && !s.memberIds.includes(agentId)) {
          return { ...s, memberIds: [...s.memberIds, agentId] };
        }
        if (s.id !== squadId && s.memberIds.includes(agentId)) {
          return { ...s, memberIds: s.memberIds.filter((id) => id !== agentId) };
        }
        return s;
      }),
    );
    await api.addSquadMember(squadId, agentId);
  }, []);

  const moveSquad = useCallback(async (squadId: string, x: number, y: number) => {
    setSquads((prev) =>
      prev.map((s) => (s.id === squadId ? { ...s, position: { x, y } } : s)),
    );
    await api.updateSquad(squadId, { position: { x, y } });
  }, []);

  const removeFromSquad = useCallback(async (squadId: string, agentId: string) => {
    setSquads((prev) =>
      prev.map((s) => {
        if (s.id === squadId) {
          return { ...s, memberIds: s.memberIds.filter((id) => id !== agentId) };
        }
        return s;
      }),
    );
    await api.removeSquadMember(squadId, agentId);
  }, []);

  return { company, agents, tasks, squads, messages, running, toggleSimulation, addToSquad, removeFromSquad, moveSquad };
}
