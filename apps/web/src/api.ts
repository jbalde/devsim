const BASE = '/api';

async function request<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  return res.json();
}

export const api = {
  getCompany: () => request('/company'),
  updateCompany: (data: Record<string, unknown>) =>
    request('/company', { method: 'PATCH', body: JSON.stringify(data) }),

  getAgents: () => request('/agents'),
  hireAgent: (role: string) =>
    request('/agents/hire', { method: 'POST', body: JSON.stringify({ role }) }),
  fireAgent: (id: string) =>
    request(`/agents/${id}`, { method: 'DELETE' }),
  updateAgentPosition: (id: string, x: number, y: number) =>
    request(`/agents/${id}/position`, { method: 'PATCH', body: JSON.stringify({ x, y }) }),
  getMessages: () => request('/agents/messages'),

  getTasks: () => request('/tasks'),
  createTask: (data: { title: string; description: string; requiredSkills?: string[]; estimatedTicks?: number }) =>
    request('/tasks', { method: 'POST', body: JSON.stringify(data) }),

  startSimulation: () => request('/simulation/start', { method: 'POST' }),
  stopSimulation: () => request('/simulation/stop', { method: 'POST' }),
  getSimulationStatus: () => request<{ running: boolean }>('/simulation/status'),
};
