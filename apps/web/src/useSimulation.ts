import { useState, useEffect, useCallback } from 'react';
import { Agent, AgentMessage, Task, Company, Squad, LlmProvider, Project, WsEvent } from '@devsim/shared';
import { socket } from './socket';
import { api } from './api';

export function useSimulation() {
  const [company, setCompany] = useState<Company | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [providers, setProviders] = useState<LlmProvider[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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
      api.getLlmProviders(),
      api.getProjects(),
    ]).then(([c, a, t, m, s, sq, lp, pr]) => {
      setCompany(c as Company);
      setAgents(a as Agent[]);
      setTasks(t as Task[]);
      setMessages(m as AgentMessage[]);
      setRunning((s as { running: boolean }).running);
      setSquads(sq as Squad[]);
      setProviders(lp as LlmProvider[]);
      setProjects(pr as Project[]);
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
    socket.on(WsEvent.TASK_DELETED, ({ id }: { id: string }) =>
      setTasks((prev) => prev.filter((x) => x.id !== id)),
    );

    socket.on(WsEvent.MESSAGE_SENT, (m: AgentMessage) =>
      setMessages((prev) => [...prev.slice(-99), m]),
    );
    socket.on(WsEvent.MESSAGES_CLEARED, () => setMessages([]));

    socket.on(WsEvent.SQUAD_CREATED, (sq: Squad) =>
      setSquads((prev) => [...prev, sq]),
    );
    socket.on(WsEvent.SQUAD_UPDATED, (sq: Squad) =>
      setSquads((prev) => prev.map((x) => (x.id === sq.id ? sq : x))),
    );
    socket.on(WsEvent.SQUAD_DELETED, ({ id }: { id: string }) =>
      setSquads((prev) => prev.filter((x) => x.id !== id)),
    );

    socket.on(WsEvent.LLM_PROVIDER_CREATED, (p: LlmProvider) =>
      setProviders((prev) => [...prev, p]),
    );
    socket.on(WsEvent.LLM_PROVIDER_UPDATED, (p: LlmProvider) =>
      setProviders((prev) => prev.map((x) => (x.id === p.id ? p : x))),
    );
    socket.on(WsEvent.LLM_PROVIDER_DELETED, ({ id }: { id: string }) =>
      setProviders((prev) => prev.filter((x) => x.id !== id)),
    );

    socket.on(WsEvent.PROJECT_CREATED, (p: Project) =>
      setProjects((prev) => [...prev, p]),
    );
    socket.on(WsEvent.PROJECT_UPDATED, (p: Project) =>
      setProjects((prev) => prev.map((x) => (x.id === p.id ? p : x))),
    );
    socket.on(WsEvent.PROJECT_DELETED, ({ id }: { id: string }) =>
      setProjects((prev) => prev.filter((x) => x.id !== id)),
    );

    return () => {
      socket.off(WsEvent.COMPANY_UPDATED);
      socket.off(WsEvent.AGENT_HIRED);
      socket.off(WsEvent.AGENT_UPDATED);
      socket.off(WsEvent.AGENT_FIRED);
      socket.off(WsEvent.TASK_CREATED);
      socket.off(WsEvent.TASK_UPDATED);
      socket.off(WsEvent.TASK_DELETED);
      socket.off(WsEvent.MESSAGE_SENT);
      socket.off(WsEvent.MESSAGES_CLEARED);
      socket.off(WsEvent.SQUAD_CREATED);
      socket.off(WsEvent.SQUAD_UPDATED);
      socket.off(WsEvent.SQUAD_DELETED);
      socket.off(WsEvent.LLM_PROVIDER_CREATED);
      socket.off(WsEvent.LLM_PROVIDER_UPDATED);
      socket.off(WsEvent.LLM_PROVIDER_DELETED);
      socket.off(WsEvent.PROJECT_CREATED);
      socket.off(WsEvent.PROJECT_UPDATED);
      socket.off(WsEvent.PROJECT_DELETED);
    };
  }, []);

  const toggleSimulation = useCallback(async () => {
    if (running) {
      await api.stopSimulation();
    } else {
      await api.startSimulation();
    }
    const status = await api.getSimulationStatus();
    setRunning((status as { running: boolean }).running);
  }, [running]);

  const addToSquad = useCallback(async (agentId: string, squadId: string) => {
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

  /** Re-fetch all state from the server */
  const refresh = useCallback(async () => {
    const [c, a, t, m, sq, lp, pr] = await Promise.all([
      api.getCompany(),
      api.getAgents(),
      api.getTasks(),
      api.getMessages(),
      api.getSquads(),
      api.getLlmProviders(),
      api.getProjects(),
    ]);
    setCompany(c as Company);
    setAgents(a as Agent[]);
    setTasks(t as Task[]);
    setMessages(m as AgentMessage[]);
    setSquads(sq as Squad[]);
    setProviders(lp as LlmProvider[]);
    setProjects(pr as Project[]);
  }, []);

  const refreshProviders = useCallback(async () => {
    const lp = await api.getLlmProviders();
    setProviders(lp as LlmProvider[]);
  }, []);

  const createSquad = useCallback(async (name: string) => {
    await api.createSquad({ name });
    const sq = await api.getSquads();
    setSquads(sq as Squad[]);
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

  const clearMessages = useCallback(async () => {
    setMessages([]);
    await api.clearMessages();
    await api.saveState();
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    // Optimistic: remove immediately
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await api.deleteTask(id);
  }, []);

  const updateTask = useCallback(async (id: string, data: Record<string, unknown>) => {
    // Optimistic: update immediately
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...data } as Task : t)),
    );
    await api.updateTask(id, data);
  }, []);

  return {
    company, agents, tasks, squads, messages, providers, projects, running,
    toggleSimulation, addToSquad, removeFromSquad, moveSquad,
    refreshProviders, refresh, createSquad, deleteTask, updateTask, clearMessages,
  };
}
