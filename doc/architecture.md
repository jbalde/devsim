# Architecture

## Overview

DevSim is a digital company simulator built as a Turbo monorepo with three packages:

```
devsim/
├── apps/
│   ├── server/          # NestJS — REST API + WebSocket + Simulation Engine
│   └── web/             # React + Vite — Game-like UI
└── packages/
    └── shared/          # TypeScript types shared between server and web
```

## Stack

| Layer     | Technology       | Purpose                              |
|-----------|------------------|--------------------------------------|
| Frontend  | React 19 + Vite  | SPA with drag-and-drop office UI     |
| Backend   | NestJS 10        | REST API + WebSocket Gateway         |
| Realtime  | Socket.IO        | Bidirectional events (agent updates) |
| Monorepo  | Turborepo + Yarn | Workspace management and build cache |
| Language  | TypeScript 5.7   | End-to-end type safety               |

## Module Structure (Server)

```
src/
├── agents/        # Agent CRUD, messaging between agents
├── company/       # Company state (budget, tokens, ticks)
├── events/        # Global WebSocket gateway (Socket.IO)
├── simulation/    # Tick-based engine that drives agent behavior
└── tasks/         # Task CRUD and assignment
```

## Data Flow

```
User Action (UI)
    │
    ▼
REST API (NestJS Controller)
    │
    ▼
Service Layer (business logic)
    │
    ├──▶ Updates in-memory state
    │
    └──▶ Emits WebSocket event
              │
              ▼
        Frontend (Socket.IO listener)
              │
              ▼
        React state update → UI re-render
```

## Simulation Engine

The simulation runs on a **tick-based loop** (every 2 seconds):

1. **Manager agents** scan for unassigned tasks and idle workers, then assign tasks
2. **Worker agents** progress their current task by 1 tick, occasionally chat
3. **Completed tasks** trigger review requests between peers
4. **Budget** decreases based on each agent's `costPerTick`
5. All state changes emit WebSocket events to the frontend

## CJS/ESM Compatibility

The `shared` package compiles to CommonJS (for NestJS) and Vite pre-bundles it for ESM consumption. All "enums" use the `const ... as const` pattern with derived types to avoid CJS/ESM interop issues.
