# DevSim

A digital company simulator where you hire AI agents, organize them into squads, assign tasks, and watch them work autonomously. Think *Game Dev Tycoon* meets team management.

## Features

- **Hire agents** with 10 different roles (PM, devs, QA, security, DevOps, UX, BI)
- **Create squads** — group agents into teams shown as tables on the office floor
- **Drag & drop** — drag agents onto squad tables to assign them, rearrange the office freely
- **Task management** — create tasks and watch managers assign them to workers
- **Projects** — group work by project and store relevant folder paths
- **LLM providers** — configure local or remote providers for simulation chat generation
- **Real-time simulation** — tick-based engine where agents work, communicate, and complete tasks
- **Live chat** — watch inter-agent messages in real time
- **Persistence** — resume company state after restarting the app
- **Localization** — switch the UI and simulation language between English and Spanish
- **Autolayout** — one-click to organize all agents and squads neatly
- **Budget tracking** — each agent costs per tick, monitor spending and token usage

## Quick Start

```bash
# Prerequisites: Node.js >= 18, Yarn v1
yarn install
yarn dev
```

- **Web UI:** http://localhost:5173
- **API Server:** http://localhost:3001

## How to Play

1. Click **Hire** to recruit agents (start with a PM + some workers)
2. Click **+ Squad** to create a team
3. **Drag agents onto squad tables** to assign them, or right-click an agent to pick a squad
4. Click **Tasks** to create work items
5. Click **Play** to start the simulation
6. Watch agents work, chat, and complete tasks
7. Use **Autolayout** to tidy up the office
8. **Right-click** agents or squads for more options (fire, remove member, delete squad)

## Tech Stack

| Layer     | Technology       |
|-----------|------------------|
| Frontend  | React 19 + Vite  |
| Backend   | NestJS 10        |
| Realtime  | Socket.IO        |
| Monorepo  | Turborepo + Yarn |
| Language  | TypeScript 5.7   |

## Project Structure

```
devsim/
├── apps/
│   ├── server/          # NestJS — REST API + WebSocket + Simulation Engine
│   └── web/             # React + Vite — Game-like office UI
├── packages/
│   └── shared/          # TypeScript types shared between server and web
├── doc/                 # Documentation (architecture, API, agents)
├── turbo.json           # Turborepo config
└── package.json         # Root workspace config
```

## Scripts

```bash
yarn dev       # Start server + web in development mode
yarn build     # Build all packages
yarn lint      # Lint all packages
yarn clean     # Clean build artifacts
```

## Documentation

- [Overview](doc/overview.md)
- [Architecture](doc/architecture.md)
- [API Reference](doc/api.md)
- [Agent Roles](doc/agents.md)
- [Getting Started](doc/getting-started.md)
