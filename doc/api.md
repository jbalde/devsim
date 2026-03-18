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
Fire an agent.

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
  "requiredSkills": ["react", "auth"],
  "estimatedTicks": 5
}
```

### PATCH /tasks/:id
Update a task.

---

## Simulation

### POST /simulation/start
Start the simulation tick loop.

### POST /simulation/stop
Pause the simulation.

### GET /simulation/status
Returns `{ "running": true|false }`.

---

## WebSocket Events

Connect via Socket.IO to `ws://localhost:3001`.

| Event               | Direction      | Payload         |
|---------------------|----------------|-----------------|
| `agent:hired`       | Server → Client| `Agent`         |
| `agent:updated`     | Server → Client| `Agent`         |
| `agent:fired`       | Server → Client| `{ id: string }`|
| `task:created`      | Server → Client| `Task`          |
| `task:updated`      | Server → Client| `Task`          |
| `message:sent`      | Server → Client| `AgentMessage`  |
| `simulation:tick`   | Server → Client| `{ tick, budget, agentCount }` |
| `company:updated`   | Server → Client| `Company`       |
