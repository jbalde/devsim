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
5. Click **Tasks** to create tasks for the team
6. Click **Play** to start the simulation
7. Watch agents work, communicate, and complete tasks
8. **Drag** agents around the office to rearrange desks
9. **Right-click** an agent to fire them

## Project Structure

```
devsim/
├── apps/
│   ├── server/       # NestJS backend
│   └── web/          # React + Vite frontend
├── packages/
│   └── shared/       # Shared TypeScript types
├── doc/              # Documentation
├── turbo.json        # Turborepo config
└── package.json      # Root workspace config
```
