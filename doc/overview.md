# Overview

## What DevSim Is

DevSim is a digital company simulator where you run a small software organization from a live office UI. You hire agents, group them into squads, create tasks, organize work by project, and watch the simulation evolve in real time.

The project combines three core ideas:

- a visual office layout with drag-and-drop interactions
- a tick-based simulation loop that advances work automatically
- a configurable LLM layer that can generate more dynamic agent conversations

## Core Concepts

### Company

The company tracks global simulation state:

- budget
- total token usage
- tick count
- running/paused state

### Agents

Agents represent people in the company. Management roles assign work, while worker roles execute tasks. Agents can:

- be hired and fired
- move around the office canvas
- join a squad
- work on a task
- send chat messages to other agents or the whole office

### Squads

Squads are teams visualized as tables in the office. They provide lightweight team organization and can be used when creating or editing tasks.

Each squad stores:

- name
- color
- office position
- member list

### Projects

Projects group related work and give more structure to the simulation. A project stores:

- name
- description
- folder definitions
- creation timestamp

Folder definitions can describe frontend, backend, docs, config, or other areas of a codebase.

### Tasks

Tasks are the main units of work in the simulator. A task can include:

- title and description
- priority
- status
- assignee
- linked project
- linked squad
- required skills
- estimated and elapsed ticks

### LLM Providers

DevSim can talk to one or more OpenAI-compatible LLM backends. Providers can be local or remote and are ordered by priority for fallback.

Supported provider types are:

- Ollama
- LM Studio
- OpenAI-compatible endpoints
- custom providers

## Main Workflows

### Build a Team

1. Hire managers and workers.
2. Create one or more squads.
3. Drag agents onto squad tables or assign them through the context menu.

### Organize Work

1. Create a project.
2. Optionally define project folders such as frontend or backend paths.
3. Create tasks and associate them with a project and/or squad.

### Run the Simulation

1. Start the simulation from the top bar.
2. Managers assign backlog work to available workers.
3. Workers progress tasks over time.
4. Completed work can trigger review conversations between peers.

### Configure AI Chat

1. Open the LLM panel.
2. Add one or more providers.
3. Test provider health.
4. Reorder providers to control fallback priority.

If no provider is available, the simulation still works by falling back to predefined chat lines.

## Frontend Surface

The current UI is centered around five main areas:

- top bar for global actions, stats, and locale switching
- office canvas for agents and squads
- hire panel for recruitment
- task panel for list, detail, create, edit, and delete flows
- side panels for projects and LLM providers
- chat log with filtering by agent and squad

## Realtime and Persistence

Most UI state is synchronized in two ways:

- REST endpoints handle commands and initial loading
- WebSocket events keep the client updated after changes

Simulation state is also persisted to disk so the company can be restored after a restart. By default, data is written to `data/state.json`.

## Localization

DevSim currently supports:

- English
- Spanish

The frontend can switch locale from the top bar, and the selected locale is synced to the server so simulation text and fallback prompts stay aligned.
