import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  AgentStatus,
  AgentRole,
  TaskStatus,
  AGENT_PROFILES,
  WsEvent,
} from '@devsim/shared';
import { AgentsService } from '../agents/agents.service';
import { TasksService } from '../tasks/tasks.service';
import { CompanyService } from '../company/company.service';
import { EventsGateway } from '../events/events.gateway';

const TICK_INTERVAL_MS = 2000;

const CHAT_LINES: Record<string, string[]> = {
  working: [
    'Making progress on this...',
    'Almost there with this feature.',
    'Found an edge case, handling it now.',
    'Writing tests for this module.',
    'Refactoring a bit before moving on.',
  ],
  asking_help: [
    'Hey, can someone review this approach?',
    'I need a second opinion on this design.',
    'Could use some help with this blocker.',
  ],
  reviewing: [
    'Looks good! Just one small suggestion.',
    'LGTM, nice work!',
    'Found a potential issue in the implementation.',
  ],
  managing: [
    'Let me check the sprint board...',
    'Updating the timeline for stakeholders.',
    'How is everyone doing on their tasks?',
    'Let\'s make sure we hit the deadline.',
  ],
};

@Injectable()
export class SimulationService implements OnModuleDestroy {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private agents: AgentsService,
    private tasks: TasksService,
    private company: CompanyService,
    private events: EventsGateway,
  ) {}

  onModuleDestroy() {
    this.stop();
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  start() {
    if (this.timer) return;
    this.company.update({ isRunning: true });
    this.timer = setInterval(() => this.tick(), TICK_INTERVAL_MS);
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
    this.company.update({ isRunning: false });
  }

  /** One simulation tick — agents work, talk, and advance tasks */
  private tick() {
    const allAgents = this.agents.getAll();
    const company = this.company.get();

    this.company.tick();
    let tickCost = 0;

    for (const agent of allAgents) {
      const profile = AGENT_PROFILES[agent.role];
      tickCost += profile.costPerTick;

      // --- Manager roles: assign unassigned tasks ---
      if (
        agent.role === AgentRole.PROJECT_MANAGER ||
        agent.role === AgentRole.PRODUCT_MANAGER
      ) {
        this.handleManager(agent.id, agent.role);
        continue;
      }

      // --- Worker roles: work on assigned task ---
      if (agent.currentTaskId) {
        this.handleWorker(agent.id, agent.currentTaskId);
      } else {
        // Idle worker — announce availability
        if (Math.random() < 0.15) {
          this.agents.updateAgent(agent.id, { status: AgentStatus.IDLE });
          this.agents.agentChat(agent.id, null, `I'm free — anyone need help?`);
        }
      }
    }

    this.company.spendBudget(tickCost);
    this.company.addTokensUsed(allAgents.length);
    this.events.emit(WsEvent.TICK, {
      tick: company.tickCount + 1,
      budget: company.budget - tickCost,
      agentCount: allAgents.length,
    });
    this.events.emit(WsEvent.COMPANY_UPDATED, this.company.get());
  }

  private handleManager(agentId: string, role: AgentRole) {
    const unassigned = this.tasks.getUnassigned();
    const workers = this.agents
      .getAll()
      .filter(
        (a) =>
          a.role !== AgentRole.PROJECT_MANAGER &&
          a.role !== AgentRole.PRODUCT_MANAGER &&
          !a.currentTaskId,
      );

    if (unassigned.length > 0 && workers.length > 0) {
      // Assign best matching task to available worker
      const task = unassigned[0];
      const worker = workers[0];

      this.tasks.update(task.id, {
        assigneeId: worker.id,
        status: TaskStatus.IN_PROGRESS,
      });
      this.agents.updateAgent(worker.id, {
        currentTaskId: task.id,
        status: AgentStatus.WORKING,
      });

      this.agents.agentChat(
        agentId,
        worker.id,
        `Hey ${worker.name}, I'm assigning "${task.title}" to you.`,
        task.id,
      );
      this.agents.agentChat(
        worker.id,
        agentId,
        `Got it! I'll start working on "${task.title}" now.`,
        task.id,
      );
    } else if (Math.random() < 0.2) {
      const line = pick(CHAT_LINES.managing);
      this.agents.agentChat(agentId, null, line);
      this.agents.updateAgent(agentId, { status: AgentStatus.TALKING });
    }
  }

  private handleWorker(agentId: string, taskId: string) {
    const task = this.tasks.getById(taskId);
    if (!task) return;

    task.elapsedTicks++;
    this.tasks.update(task.id, { elapsedTicks: task.elapsedTicks });

    // Random chat while working
    if (Math.random() < 0.25) {
      const line = pick(CHAT_LINES.working);
      this.agents.agentChat(agentId, null, line, taskId);
      this.agents.updateAgent(agentId, { status: AgentStatus.TALKING });
    } else {
      this.agents.updateAgent(agentId, { status: AgentStatus.WORKING });
    }

    // Task complete?
    if (task.elapsedTicks >= task.estimatedTicks) {
      this.tasks.update(task.id, {
        status: TaskStatus.DONE,
        completedAt: Date.now(),
      });
      this.agents.updateAgent(agentId, {
        currentTaskId: null,
        status: AgentStatus.IDLE,
      });

      const agent = this.agents.getById(agentId)!;
      this.agents.agentChat(
        agentId,
        null,
        `Finished "${task.title}"! Moving on.`,
        taskId,
      );

      // Ask for review from a random peer
      const peers = this.agents
        .getAll()
        .filter((a) => a.id !== agentId && a.role !== AgentRole.PROJECT_MANAGER && a.role !== AgentRole.PRODUCT_MANAGER);
      if (peers.length > 0) {
        const reviewer = peers[Math.floor(Math.random() * peers.length)];
        this.agents.agentChat(
          agentId,
          reviewer.id,
          `Hey ${reviewer.name}, can you review "${task.title}"?`,
          taskId,
        );
        this.agents.agentChat(
          reviewer.id,
          agentId,
          pick(CHAT_LINES.reviewing),
          taskId,
        );
      }
    }
  }
}

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
