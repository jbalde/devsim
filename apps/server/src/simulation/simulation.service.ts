import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  AgentStatus,
  AgentRole,
  TaskStatus,
  AGENT_PROFILES,
  WsEvent,
  t,
  interpolate,
  getTranslations,
} from '@devsim/shared';
import { AgentsService } from '../agents/agents.service';
import { TasksService } from '../tasks/tasks.service';
import { CompanyService } from '../company/company.service';
import { EventsGateway } from '../events/events.gateway';
import { LlmService } from '../llm/llm.service';

const TICK_INTERVAL_MS = 2000;

/** Map AgentRole to the translation key path */
const ROLE_I18N_KEY: Record<AgentRole, keyof ReturnType<typeof t>['agents']> = {
  [AgentRole.PRODUCT_MANAGER]: 'productManager',
  [AgentRole.PROJECT_MANAGER]: 'projectManager',
  [AgentRole.FRONTEND_DEV]: 'frontendDev',
  [AgentRole.BACKEND_DEV]: 'backendDev',
  [AgentRole.FULLSTACK_DEV]: 'fullstackDev',
  [AgentRole.BI_ANALYST]: 'biAnalyst',
  [AgentRole.SECURITY_ENGINEER]: 'securityEngineer',
  [AgentRole.QA_ENGINEER]: 'qaEngineer',
  [AgentRole.DEVOPS_ENGINEER]: 'devopsEngineer',
  [AgentRole.UX_DESIGNER]: 'uxDesigner',
};

@Injectable()
export class SimulationService implements OnModuleDestroy {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private llmUsedThisTick = false;

  constructor(
    private agents: AgentsService,
    private tasks: TasksService,
    private company: CompanyService,
    private events: EventsGateway,
    private llm: LlmService,
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
    this.scheduleTick();
  }

  stop() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
    this.company.update({ isRunning: false });
  }

  private scheduleTick() {
    this.timer = setTimeout(async () => {
      await this.tick();
      if (this.timer) {
        this.scheduleTick();
      }
    }, TICK_INTERVAL_MS);
  }

  /** One simulation tick — agents work, talk, and advance tasks */
  private async tick() {
    const allAgents = this.agents.getAll();
    const company = this.company.get();
    const s = t().sim;

    this.company.tick();
    this.llmUsedThisTick = false;
    let tickCost = 0;

    for (const agent of allAgents) {
      const profile = AGENT_PROFILES[agent.role];
      tickCost += profile.costPerTick;

      // --- Manager roles: assign unassigned tasks ---
      if (
        agent.role === AgentRole.PROJECT_MANAGER ||
        agent.role === AgentRole.PRODUCT_MANAGER
      ) {
        await this.handleManager(agent.id, agent.role);
        continue;
      }

      // --- Worker roles: work on assigned task ---
      if (agent.currentTaskId) {
        await this.handleWorker(agent.id, agent.currentTaskId);
      } else {
        // Idle worker — announce availability
        if (Math.random() < 0.15) {
          this.agents.updateAgent(agent.id, { status: AgentStatus.IDLE });
          const msg = await this.generateChat(
            agent.id,
            s.contextIdle,
            s.idleAnnounce,
          );
          this.agents.agentChat(agent.id, null, msg);
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

  private async handleManager(agentId: string, role: AgentRole) {
    const s = t().sim;
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

      const assignMsg = await this.generateChat(
        agentId,
        interpolate(s.contextAssign, { task: task.title, worker: worker.name }),
        interpolate(s.assignTask, { task: task.title, worker: worker.name }),
      );
      this.agents.agentChat(agentId, worker.id, assignMsg, task.id);

      const ackMsg = await this.generateChat(
        worker.id,
        interpolate(s.contextAck, { task: task.title }),
        interpolate(s.ackTask, { task: task.title }),
      );
      this.agents.agentChat(worker.id, agentId, ackMsg, task.id);
    } else if (Math.random() < 0.2) {
      const line = await this.generateChat(
        agentId,
        s.contextManaging,
        pick(s.managing),
      );
      this.agents.agentChat(agentId, null, line);
      this.agents.updateAgent(agentId, { status: AgentStatus.TALKING });
    }
  }

  private async handleWorker(agentId: string, taskId: string) {
    const s = t().sim;
    const task = this.tasks.getById(taskId);
    if (!task) return;

    task.elapsedTicks++;
    this.tasks.update(task.id, { elapsedTicks: task.elapsedTicks });

    // Random chat while working
    if (Math.random() < 0.25) {
      const line = await this.generateChat(
        agentId,
        interpolate(s.contextWorkUpdate, {
          task: task.title,
          elapsed: task.elapsedTicks,
          estimated: task.estimatedTicks,
        }),
        pick(s.working),
      );
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

      const doneMsg = await this.generateChat(
        agentId,
        interpolate(s.contextFinish, { task: task.title }),
        interpolate(s.finishTask, { task: task.title }),
      );
      this.agents.agentChat(agentId, null, doneMsg, taskId);

      // Ask for review from a random peer
      const peers = this.agents
        .getAll()
        .filter((a) => a.id !== agentId && a.role !== AgentRole.PROJECT_MANAGER && a.role !== AgentRole.PRODUCT_MANAGER);
      if (peers.length > 0) {
        const reviewer = peers[Math.floor(Math.random() * peers.length)];
        const reviewReqMsg = await this.generateChat(
          agentId,
          interpolate(s.contextReviewReq, { reviewer: reviewer.name, task: task.title }),
          interpolate(s.requestReview, { reviewer: reviewer.name, task: task.title }),
        );
        this.agents.agentChat(agentId, reviewer.id, reviewReqMsg, taskId);

        const reviewMsg = await this.generateChat(
          reviewer.id,
          interpolate(s.contextReviewReply, { task: task.title }),
          pick(s.reviewing),
        );
        this.agents.agentChat(reviewer.id, agentId, reviewMsg, taskId);
      }
    }
  }

  /**
   * Generate chat via LLM with fallback to hardcoded text.
   * Only one LLM call per tick to avoid overwhelming local servers.
   */
  private async generateChat(agentId: string, context: string, fallback: string): Promise<string> {
    if (this.llmUsedThisTick || !this.llm.hasProviders()) {
      return fallback;
    }

    const agent = this.agents.getById(agentId);
    if (!agent) return fallback;
    const profile = AGENT_PROFILES[agent.role];
    const s = t().sim;
    const agentI18n = t().agents[ROLE_I18N_KEY[agent.role]];

    this.llmUsedThisTick = true;

    const systemPrompt = interpolate(s.systemPrompt, {
      name: agent.name,
      role: agentI18n.label,
      description: agentI18n.description,
    });

    const result = await this.llm.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: context },
    ]);

    return result ?? fallback;
  }
}

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}
