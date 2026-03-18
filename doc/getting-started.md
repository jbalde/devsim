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

## Build

```bash
yarn build
```

## How to Use

1. Open http://localhost:5173
2. Click **Hire** to open the hiring panel
3. Hire a **Project Manager** or **Product Manager** (they assign tasks)
4. Hire workers: Frontend Dev, Backend Dev, QA, etc.
5. Click **+ Squad** to create a team — squads appear as tables in the office
6. **Drag agents onto a squad table** to add them to the team
7. Click **Tasks** to create tasks for the team
8. Click **Play** to start the simulation
9. Watch agents work, communicate, and complete tasks
10. Use **Autolayout** to automatically organize agents and squads
11. **Drag** agents and squad tables around the office to rearrange
12. **Right-click** an agent to fire them or assign to a squad
13. **Right-click** a squad to remove members or delete it

## Project Structure

```
devsim/
├── apps/
│   ├── server/       # NestJS backend
│   │   └── src/
│   │       ├── agents/       # Agent CRUD & messaging
│   │       ├── company/      # Company state
│   │       ├── events/       # WebSocket gateway
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
│           │   ├── TaskPanel.tsx    # Task creation and list
│           │   └── ChatLog.tsx      # Real-time agent chat
│           ├── useSimulation.ts     # State management hook
│           ├── api.ts               # HTTP client
│           └── socket.ts            # WebSocket client
├── packages/
│   └── shared/       # Shared TypeScript types
├── doc/              # Documentation
├── turbo.json        # Turborepo config
└── package.json      # Root workspace config
```
