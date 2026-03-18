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

  getSquads: () => request('/squads'),
  createSquad: (data: { name: string; position?: { x: number; y: number } }) =>
    request('/squads', { method: 'POST', body: JSON.stringify(data) }),
  updateSquad: (id: string, data: Record<string, unknown>) =>
    request(`/squads/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSquad: (id: string) =>
    request(`/squads/${id}`, { method: 'DELETE' }),
  addSquadMember: (squadId: string, agentId: string) =>
    request(`/squads/${squadId}/members/${agentId}`, { method: 'POST' }),
  removeSquadMember: (squadId: string, agentId: string) =>
    request(`/squads/${squadId}/members/${agentId}`, { method: 'DELETE' }),

  startSimulation: () => request('/simulation/start', { method: 'POST' }),
  stopSimulation: () => request('/simulation/stop', { method: 'POST' }),
  getSimulationStatus: () => request<{ running: boolean }>('/simulation/status'),
};
