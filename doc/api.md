# API Reference

Base URL: `http://localhost:3001`

## Company

### GET /company
Returns the current company state.

**Response:**
```json
{
  "id": "uuid",
  "name": "My Startup",
  "budget": 1000,
  "totalTokensUsed": 0,
  "tickCount": 0,
  "isRunning": false,
  "createdAt": 1710000000000
}
```

### PATCH /company
Update company properties (e.g., name).

**Body:** `Partial<Company>`

---

## Agents

### GET /agents
List all hired agents.

### POST /agents/hire
Hire a new agent.

**Body:**
```json
{ "role": "frontend_dev" }
```

**Available roles:** `product_manager`, `project_manager`, `frontend_dev`, `backend_dev`, `fullstack_dev`, `bi_analyst`, `security_engineer`, `qa_engineer`, `devops_engineer`, `ux_designer`

### DELETE /agents/:id
Fire an agent. Also removes the agent from any squad they belong to.

### PATCH /agents/:id/position
Update agent position on the office canvas.

**Body:**
```json
{ "x": 200, "y": 300 }
```

### GET /agents/messages
Get the last 50 inter-agent messages.

---

## Tasks

### GET /tasks
List all tasks.

### POST /tasks
Create a new task.

**Body:**
```json
{
  "title": "Build login page",
  "description": "Implement auth UI with email/password",
  "projectId": "optional-project-id",
  "squadId": "optional-squad-id",
  "requiredSkills": ["react", "auth"],
  "estimatedTicks": 5
}
```

### PATCH /tasks/:id
Update a task.

### DELETE /tasks/:id
Delete a task.

---

## Squads

### GET /squads
List all squads.

### POST /squads
Create a new squad.

**Body:**
```json
{
  "name": "Frontend Team",
  "position": { "x": 100, "y": 400 }
}
```

**Response:** `Squad` object with auto-assigned color.

### PATCH /squads/:id
Update squad properties (name, position, etc.).

**Body:** `Partial<Squad>`

### DELETE /squads/:id
Delete a squad. Members become free agents.

### POST /squads/:id/members/:agentId
Add an agent to a squad. If the agent is already in another squad, they are automatically removed from it first.

### DELETE /squads/:id/members/:agentId
Remove an agent from a squad. The agent becomes a free agent.

---

## Simulation

### POST /simulation/start
Start the simulation tick loop.

### POST /simulation/stop
Pause the simulation.

### GET /simulation/status
Returns `{ "running": true|false }`.

### GET /simulation/locale
Returns the active locale used by the simulation.

### POST /simulation/locale
Set the active locale.

**Body:**
```json
{ "locale": "en" }
```

---

## LLM Providers

### GET /llm/providers
List all configured providers.

### POST /llm/providers
Create a provider.

**Body:**
```json
{
  "name": "Local Ollama",
  "type": "ollama",
  "baseUrl": "http://localhost:11434",
  "model": "llama3.1",
  "priority": 0,
  "enabled": true
}
```

### PATCH /llm/providers/:id
Update a provider.

### DELETE /llm/providers/:id
Delete a provider.

### POST /llm/providers/reorder
Reorder providers by priority.

**Body:**
```json
{ "ids": ["provider-a", "provider-b"] }
```

### POST /llm/providers/:id/health
Run a health check for one provider.

### POST /llm/providers/health
Run health checks for all providers.

---

## Projects

### GET /projects
List all projects.

### POST /projects
Create a project.

**Body:**
```json
{
  "name": "Website refresh",
  "description": "Landing page and onboarding improvements",
  "folders": [
    { "label": "frontend", "path": "apps/web", "type": "frontend" },
    { "label": "backend", "path": "apps/server", "type": "backend" }
  ]
}
```

### PATCH /projects/:id
Update a project.

### DELETE /projects/:id
Delete a project.

---

## WebSocket Events

Connect via Socket.IO to `ws://localhost:3001`.

| Event               | Direction       | Payload                            |
|---------------------|-----------------|------------------------------------|
| `agent:hired`       | Server → Client | `Agent`                            |
| `agent:updated`     | Server → Client | `Agent`                            |
| `agent:fired`       | Server → Client | `{ id: string }`                   |
| `task:created`      | Server → Client | `Task`                             |
| `task:updated`      | Server → Client | `Task`                             |
| `task:deleted`      | Server → Client | `{ id: string }`                   |
| `message:sent`      | Server → Client | `AgentMessage`                     |
| `simulation:tick`   | Server → Client | `{ tick, budget, agentCount }`     |
| `company:updated`   | Server → Client | `Company`                          |
| `squad:created`     | Server → Client | `Squad`                            |
| `squad:updated`     | Server → Client | `Squad`                            |
| `squad:deleted`     | Server → Client | `{ id: string }`                   |
| `llm:provider:created` | Server → Client | `LlmProvider`                   |
| `llm:provider:updated` | Server → Client | `LlmProvider`                   |
| `llm:provider:deleted` | Server → Client | `{ id: string }`                |
| `project:created`   | Server → Client | `Project`                          |
| `project:updated`   | Server → Client | `Project`                          |
| `project:deleted`   | Server → Client | `{ id: string }`                   |
