import { useState, useEffect, useCallback } from 'react';
import { Agent, AgentMessage, Task, Company, WsEvent } from '@devsim/shared';
import { socket } from './socket';
import { api } from './api';

export function useSimulation() {
  const [company, setCompany] = useState<Company | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
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
    ]).then(([c, a, t, m, s]) => {
      setCompany(c as Company);
      setAgents(a as Agent[]);
      setTasks(t as Task[]);
      setMessages(m as AgentMessage[]);
      setRunning((s as { running: boolean }).running);
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

    return () => {
      socket.off(WsEvent.COMPANY_UPDATED);
      socket.off(WsEvent.AGENT_HIRED);
      socket.off(WsEvent.AGENT_UPDATED);
      socket.off(WsEvent.AGENT_FIRED);
      socket.off(WsEvent.TASK_CREATED);
      socket.off(WsEvent.TASK_UPDATED);
      socket.off(WsEvent.MESSAGE_SENT);
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

  return { company, agents, tasks, messages, running, toggleSimulation };
}
