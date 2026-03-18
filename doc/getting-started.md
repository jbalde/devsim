# Getting Started

## Prerequisites

- Node.js >= 18
- Yarn v1

## Installation

```bash
git clone <repo-url>
cd devsim
yarn install
```

## Development

```bash
yarn dev
```

This starts both the server and web app in parallel:
- **Server:** http://localhost:3001
- **Web:** http://localhost:5173

Simulation state is persisted locally under `data/state.json` unless `DEVSIM_DATA_PATH` is set.

## Build

```bash
yarn build
```

## How to Use

1. Open http://localhost:5173
2. Click **Hire** to open the hiring panel
3. Hire a **Project Manager** or **Product Manager** so work can be assigned
4. Hire workers: Frontend Dev, Backend Dev, QA, DevOps, and others
5. Click **+ Squad** to create a team
6. **Drag agents onto a squad table** to assign them to a team
7. Open **Projects** to create a project and optionally define folder paths
8. Open **Tasks** to create work items and optionally link them to a project or squad
9. Open **LLM** if you want simulation chat to use a local or remote provider
10. Click **Play** to start the simulation
11. Watch managers assign work and workers progress tasks
12. Use **Autolayout** to automatically organize agents and squads
13. **Drag** agents and squad tables around the office to rearrange the layout
14. Use the locale toggle in the top bar to switch between English and Spanish
15. **Right-click** agents or squads for contextual actions

## Project Structure

```
devsim/
├── apps/
│   ├── server/       # NestJS backend
│   │   └── src/
│   │       ├── agents/       # Agent CRUD & messaging
│   │       ├── company/      # Company state
│   │       ├── events/       # WebSocket gateway
│   │       ├── llm/          # LLM provider registry and health checks
│   │       ├── persistence/  # Save/load state snapshots
│   │       ├── projects/     # Project CRUD and folder metadata
│   │       ├── simulation/   # Tick-based engine
│   │       ├── squads/       # Squad management
│   │       └── tasks/        # Task CRUD
│   └── web/          # React + Vite frontend
│       └── src/
│           ├── components/
│           │   ├── Office.tsx       # Main office canvas (pan, drag, drop)
│           │   ├── SquadTable.tsx   # Squad table visualization
│           │   ├── TopBar.tsx       # Stats bar and action buttons
│           │   ├── HirePanel.tsx    # Agent hiring panel
│           │   ├── TaskPanel.tsx    # Task list, detail, create, edit
│           │   ├── ProjectPanel.tsx # Project management panel
│           │   ├── LlmPanel.tsx     # LLM provider management panel
│           │   └── ChatLog.tsx      # Real-time agent chat
│           ├── useSimulation.ts     # State management hook
│           ├── api.ts               # HTTP client
│           ├── i18n.tsx             # Locale context and translations
│           └── socket.ts            # WebSocket client
├── packages/
│   └── shared/       # Shared types and i18n resources
├── doc/              # Documentation
├── turbo.json        # Turborepo config
└── package.json      # Root workspace config
```
