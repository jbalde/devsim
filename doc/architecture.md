# Architecture

## Overview

DevSim is a digital company simulator built as a Turbo monorepo with three main areas:

```
devsim/
├── apps/
│   ├── server/          # NestJS — REST API + WebSocket + Simulation Engine
│   └── web/             # React + Vite — Game-like UI
└── packages/
    └── shared/          # Shared types, translations, and constants
```

## Stack

| Layer     | Technology       | Purpose                              |
|-----------|------------------|--------------------------------------|
| Frontend  | React 19 + Vite  | SPA with office UI and management panels |
| Backend   | NestJS 10        | REST API, simulation engine, persistence |
| Realtime  | Socket.IO        | Bidirectional events and live sync       |
| Monorepo  | Turborepo + Yarn | Workspace management and build cache     |
| Language  | TypeScript 5.7   | End-to-end type safety                   |

## Module Structure (Server)

```
src/
├── agents/        # Agent CRUD, messaging between agents
├── company/       # Company state (budget, tokens, ticks)
├── events/        # Global WebSocket gateway (Socket.IO)
├── llm/           # Provider registry, health checks, chat fallback chain
├── persistence/   # Save/load simulation state to disk
├── projects/      # Project CRUD and folder metadata
├── simulation/    # Tick-based engine that drives agent behavior
├── squads/        # Squad CRUD, member management
└── tasks/         # Task CRUD and assignment
```

Circular dependency between `AgentsModule` and `SquadsModule` is resolved via NestJS `forwardRef`.

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

Persistence sits alongside this flow. Services restore state on startup and periodically write snapshots back to disk.

### Optimistic Updates

Squad operations and some task interactions use **optimistic updates**. The frontend updates local state immediately, then sends the API call in the background. This avoids waiting for the server round-trip and WebSocket event, making interactions feel instant.

## Simulation Engine

The simulation runs on a **tick-based loop** (every 2 seconds):

1. **Manager agents** scan for unassigned tasks and idle workers, then assign tasks
2. **Worker agents** progress their current task by 1 tick, occasionally chat
3. **Completed tasks** trigger review requests between peers
4. **Budget** decreases based on each agent's `costPerTick`
5. All state changes emit WebSocket events to the frontend

Chat generation now has two layers:

- preferred path: generate a message through the configured LLM providers
- fallback path: use predefined localized text when no provider is available or a provider fails

Only one LLM call is attempted per tick to avoid overloading local model servers.

## Squad System

Squads represent work teams and are visualized as tables on the office canvas:

- Each squad has a name, color, position, and list of member IDs
- Agents can be added to squads by **dragging them onto the table** or via the right-click context menu
- An agent can only belong to one squad at a time (adding to a new squad removes from the previous)
- Squads can be dragged around the office and are included in the autolayout algorithm
- The autolayout calculates each squad's size based on member count to prevent overlapping

## Projects and Tasks

Projects add a lightweight structure layer above tasks:

- tasks can optionally reference a project
- tasks can optionally reference a squad
- projects can store folder metadata to describe codebase areas
- the task panel can focus on a selected project's work

This keeps the simulation usable both as a toy office sim and as a small delivery-planning sandbox.

## Persistence Model

The persistence module saves and restores:

- company state
- agents
- chat messages
- tasks
- squads
- LLM providers
- projects

By default, snapshots are written to `data/state.json`, and the path can be overridden with `DEVSIM_DATA_PATH`.

## CJS/ESM Compatibility

The `shared` package compiles to CommonJS (for NestJS) and Vite pre-bundles it for ESM consumption. All "enums" use the `const ... as const` pattern with derived types to avoid CJS/ESM interop issues.

It now also contains the translation resources used by both frontend and backend so UI text and simulation prompts stay aligned.
