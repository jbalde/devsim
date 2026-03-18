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
  clearMessages: () => request('/agents/messages', { method: 'DELETE' }),

  getTasks: () => request('/tasks'),
  createTask: (data: { title: string; description: string; type?: string; epicId?: string; projectId?: string; squadId?: string; requiredSkills?: string[]; estimatedTicks?: number }) =>
    request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: Record<string, unknown>) =>
    request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) =>
    request(`/tasks/${id}`, { method: 'DELETE' }),

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
  setLocale: (locale: string) =>
    request('/simulation/locale', { method: 'POST', body: JSON.stringify({ locale }) }),

  getLlmProviders: () => request('/llm/providers'),
  createLlmProvider: (data: Record<string, unknown>) =>
    request('/llm/providers', { method: 'POST', body: JSON.stringify(data) }),
  updateLlmProvider: (id: string, data: Record<string, unknown>) =>
    request(`/llm/providers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteLlmProvider: (id: string) =>
    request(`/llm/providers/${id}`, { method: 'DELETE' }),
  reorderLlmProviders: (ids: string[]) =>
    request('/llm/providers/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
  checkLlmProviderHealth: (id: string) =>
    request(`/llm/providers/${id}/health`, { method: 'POST' }),
  checkAllLlmHealth: () =>
    request('/llm/providers/health', { method: 'POST' }),

  getProjects: () => request('/projects'),
  createProject: (data: { name: string; description: string; folders?: { label: string; path: string; type: string }[] }) =>
    request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: Record<string, unknown>) =>
    request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    request(`/projects/${id}`, { method: 'DELETE' }),

  saveState: () => request('/persistence/save', { method: 'POST' }),
};
