import { Injectable, OnModuleDestroy } from '@nestjs/common';
import {
  Agent,
  AgentStatus,
  AgentRole,
  MessageType,
  Project,
  Task,
  TaskPriority,
  TaskType,
  TaskStatus,
  AGENT_PROFILES,
  WsEvent,
  getAgentPrompts,
  getLocale,
  getPromptOutputLanguage,
  t,
  interpolate,
} from '@devsim/shared';
import { AgentsService } from '../agents/agents.service';
import { TasksService } from '../tasks/tasks.service';
import { CompanyService } from '../company/company.service';
import { EventsGateway } from '../events/events.gateway';
import { LlmService } from '../llm/llm.service';
import { ProjectsService } from '../projects/projects.service';
import { v4 as uuid } from 'uuid';

const TICK_INTERVAL_MS = 2000;

@Injectable()
export class SimulationService implements OnModuleDestroy {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private llmChatUsedThisTick = false;
  private llmDecisionUsedThisTick = false;
  private llmPlanningUsedThisTick = false;
  /** Track last tick the PM chatted to enforce cooldown */
  private pmLastChatTick = -999;
  /** Minimum ticks between PM chat messages when idle */
  private static readonly PM_IDLE_COOLDOWN_TICKS = 10; // ~20 seconds at 2s/tick
  /** Queue of task proposals from PM waiting for PjM to create */
  private taskProposals: Array<{
    title: string;
    description: string;
    priority: TaskPriority;
    requiredSkills: string[];
    projectId: string | null;
  }> = [];
  /** ID of the PM who made the proposals (for chat context) */
  private proposalFromAgentId: string | null = null;

  constructor(
    private agents: AgentsService,
    private tasks: TasksService,
    private company: CompanyService,
    private events: EventsGateway,
    private llm: LlmService,
    private projects: ProjectsService,
  ) {}

  onModuleDestroy() {
    this.stop();
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  start() {
    if (this.timer) return;
    if (!this.llm.hasProviders()) {
      this.sendSystemMessage(t().sim.llmStartBlocked);
      return;
    }
    this.company.update({ isRunning: true });
    const providerNames = this.llm
      .getEnabled()
      .map((provider) => provider.name)
      .join(' -> ');
    this.sendSystemMessage(
      interpolate(t().sim.llmStartUsingProviders, { providers: providerNames }),
    );
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
    const prompts = getAgentPrompts();

    this.company.tick();
    this.llmChatUsedThisTick = false;
    this.llmDecisionUsedThisTick = false;
    this.llmPlanningUsedThisTick = false;
    let tickCost = 0;

    for (const agent of allAgents) {
      const profile = AGENT_PROFILES[agent.role];
      tickCost += profile.costPerTick;

      if (agent.role === AgentRole.PRODUCT_MANAGER) {
        await this.handleProductManager(agent.id);
        continue;
      }

      if (agent.role === AgentRole.PROJECT_MANAGER) {
        await this.handleProjectManager(agent.id);
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
            prompts.chat.contextIdle,
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

  private async handleProductManager(agentId: string) {
    const currentTick = this.company.get().tickCount;

    // 1. Try to plan an epic breakdown — this is actionable work
    const planned = await this.planEpicBreakdown(agentId);
    if (planned) {
      this.agents.updateAgent(agentId, { status: AgentStatus.TALKING });
      this.pmLastChatTick = currentTick;
      return;
    }

    // 2. If proposals are pending for PjM → wait
    if (this.taskProposals.length > 0) {
      this.agents.updateAgent(agentId, { status: AgentStatus.IDLE });
      return;
    }

    // 3. Enforce cooldown between actions
    const ticksSinceLastChat = currentTick - this.pmLastChatTick;
    if (ticksSinceLastChat < SimulationService.PM_IDLE_COOLDOWN_TICKS) {
      this.agents.updateAgent(agentId, { status: AgentStatus.IDLE });
      return;
    }

    // 4. Gather state
    const s = t().sim;
    const prompts = getAgentPrompts();
    const allAgents = this.agents.getAll();
    const allTasks = this.tasks.getAll();
    const workers = allAgents.filter(
      (a) => a.role !== AgentRole.PRODUCT_MANAGER && a.role !== AgentRole.PROJECT_MANAGER,
    );
    const idleWorkers = workers.filter((w) => !w.currentTaskId);
    const unassignedTasks = this.tasks.getUnassigned();
    const pendingTasks = allTasks.filter(
      (task) => task.status !== TaskStatus.DONE && task.type === TaskType.TASK,
    );
    const doneTasks = allTasks.filter((task) => task.status === TaskStatus.DONE);

    // 5. Decide if more tasks are needed:
    //    a) No tasks at all → need initial backlog
    //    b) Idle workers with no unassigned tasks → need more work
    //    c) Few pending tasks relative to team → anticipate
    //    d) All tasks done → next phase
    const noTasksAtAll = allTasks.length === 0;
    const idleWithNoWork = idleWorkers.length > 0 && unassignedTasks.length === 0;
    const runningLow = workers.length > 0 && pendingTasks.length < Math.ceil(workers.length / 2);
    const allDone = allTasks.length > 0 && doneTasks.length === allTasks.length;
    const needsMoreTasks = noTasksAtAll || idleWithNoWork || runningLow || allDone;

    if (needsMoreTasks) {
      console.log(`[PM] tick=${currentTick} proposing tasks — noTasks=${noTasksAtAll} idleNoWork=${idleWithNoWork} runningLow=${runningLow} allDone=${allDone} workers=${workers.length} idle=${idleWorkers.length} pending=${pendingTasks.length} unassigned=${unassignedTasks.length}`);
      const proposed = await this.proposeNewTasks(agentId);
      if (proposed) {
        this.pmLastChatTick = currentTick;
        return;
      }
      console.log(`[PM] proposeNewTasks returned false — LLM may have failed or no projects`);
    }

    // 6. If work is in progress, occasional status update (very low probability)
    if (pendingTasks.length > 0 && Math.random() < 0.05) {
      const allProjects = this.projects.getAll();
      const busyWorkers = workers.filter((w) => w.currentTaskId);
      const contextParts: string[] = [prompts.chat.contextManaging];
      if (allProjects.length > 0) {
        contextParts.push(interpolate(s.ctxProjects, { list: allProjects.map((p) => p.name).join(', ') }));
      }
      contextParts.push(interpolate(s.ctxTeam, { total: workers.length, busy: busyWorkers.length, idle: idleWorkers.length }));
      contextParts.push(interpolate(s.ctxTasks, { pending: pendingTasks.length, done: doneTasks.length }));
      const sample = pendingTasks.slice(0, 3).map((task) => `"${task.title}" (${task.status})`).join(', ');
      contextParts.push(interpolate(s.ctxTasksInProgress, { sample }));

      const line = await this.generateChat(agentId, contextParts.join(' '), pick(s.managing));
      this.agents.agentChat(agentId, null, line);
      this.agents.updateAgent(agentId, { status: AgentStatus.TALKING });
      this.pmLastChatTick = currentTick;
      return;
    }

    // 7. Otherwise, stay idle
    this.agents.updateAgent(agentId, { status: AgentStatus.IDLE });
  }

  private async handleProjectManager(agentId: string) {
    const s = t().sim;
    const prompts = getAgentPrompts();

    // 1. Process task proposals from PM — create them as real tasks
    if (this.taskProposals.length > 0) {
      console.log(`[PjM] Creating ${this.taskProposals.length} tasks from PM proposals`);
      const proposals = [...this.taskProposals];
      this.taskProposals = [];
      const pmAgentId = this.proposalFromAgentId;
      this.proposalFromAgentId = null;

      for (const proposal of proposals) {
        this.tasks.create({
          title: proposal.title,
          description: proposal.description,
          priority: proposal.priority,
          requiredSkills: proposal.requiredSkills,
          projectId: proposal.projectId ?? undefined,
        });
      }

      // PjM announces task creation
      const confirmMsg = await this.generateChat(
        agentId,
        interpolate(s.pjmCreatedTasks, { count: proposals.length }),
        interpolate(s.pjmCreatedTasksFallback, { count: proposals.length }),
      );
      this.agents.agentChat(agentId, pmAgentId, confirmMsg);
      this.agents.updateAgent(agentId, { status: AgentStatus.TALKING });
      return;
    }

    // 2. Assign unassigned tasks to idle workers
    const unassigned = this.tasks.getUnassigned();
    const workers = this.agents
      .getAll()
      .filter(
        (a) =>
          a.role !== AgentRole.PROJECT_MANAGER &&
          a.role !== AgentRole.PRODUCT_MANAGER &&
          !a.currentTaskId,
      );

    const fallbackAssignment = this.findFallbackAssignment(unassigned, workers);
    if (unassigned.length > 0 && workers.length > 0 && fallbackAssignment) {
      const llmAssignment = await this.chooseAssignment(agentId, unassigned, workers);
      const task = llmAssignment?.task ?? fallbackAssignment.task;
      const worker = llmAssignment?.worker ?? fallbackAssignment.worker;

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
        interpolate(prompts.chat.contextAssign, {
          task: task.title,
          worker: worker.name,
        }),
        interpolate(s.assignTask, { task: task.title, worker: worker.name }),
      );
      this.agents.agentChat(agentId, worker.id, assignMsg, task.id);

      const ackMsg = await this.generateChat(
        worker.id,
        interpolate(prompts.chat.contextAck, { task: task.title }),
        interpolate(s.ackTask, { task: task.title }),
      );
      this.agents.agentChat(worker.id, agentId, ackMsg, task.id);
    } else {
      // 3. Idle PjM — only chat occasionally
      if (Math.random() < 0.05) {
        const allTasks = this.tasks.getAll();
        const inProgress = allTasks.filter((task) => task.status === TaskStatus.IN_PROGRESS);
        const contextParts = [prompts.chat.contextManaging];
        if (unassigned.length > 0) {
          contextParts.push(interpolate(s.ctxUnassignedTasks, { count: unassigned.length }));
        }
        if (inProgress.length > 0) {
          contextParts.push(interpolate(s.ctxTasksInProgressCount, { count: inProgress.length }));
        }
        if (workers.length === 0) {
          contextParts.push(s.ctxNoWorkersYet);
        }
        const line = await this.generateChat(
          agentId,
          contextParts.join(' '),
          pick(s.managing),
        );
        this.agents.agentChat(agentId, null, line);
        this.agents.updateAgent(agentId, { status: AgentStatus.TALKING });
      } else {
        this.agents.updateAgent(agentId, { status: AgentStatus.IDLE });
      }
    }
  }

  private async handleWorker(agentId: string, taskId: string) {
    const s = t().sim;
    const prompts = getAgentPrompts();
    const task = this.tasks.getById(taskId);
    if (!task) return;

    task.elapsedTicks++;
    this.tasks.update(task.id, { elapsedTicks: task.elapsedTicks });

    // Random chat while working
    if (Math.random() < 0.25) {
      const line = await this.generateChat(
        agentId,
        interpolate(prompts.chat.contextWorkUpdate, {
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
        interpolate(prompts.chat.contextFinish, { task: task.title }),
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
          interpolate(prompts.chat.contextReviewReq, {
            reviewer: reviewer.name,
            task: task.title,
          }),
          interpolate(s.requestReview, { reviewer: reviewer.name, task: task.title }),
        );
        this.agents.agentChat(agentId, reviewer.id, reviewReqMsg, taskId);

        const reviewMsg = await this.generateChat(
          reviewer.id,
          interpolate(prompts.chat.contextReviewReply, { task: task.title }),
          pick(s.reviewing),
        );
        this.agents.agentChat(reviewer.id, agentId, reviewMsg, taskId);
      }
    }
  }

  /**
   * Generate chat via LLM with fallback to hardcoded text.
   * Only one chat LLM call per tick to avoid overwhelming local servers.
   */
  private async generateChat(agentId: string, context: string, fallback: string): Promise<string> {
    if (this.llmChatUsedThisTick || !this.llm.hasProviders()) {
      return fallback;
    }

    const agent = this.agents.getById(agentId);
    if (!agent) return fallback;
    const prompts = getAgentPrompts();
    const agentPrompt = prompts.roles[agent.role];
    const outputLanguage = getPromptOutputLanguage(getLocale());

    this.llmChatUsedThisTick = true;

    const systemPrompt = interpolate(prompts.chat.systemPrompt, {
      name: agent.name,
      role: agentPrompt.label,
      description: agentPrompt.description,
      outputLanguage,
    });

    const userContent = getLocale() !== 'en'
      ? `[Respond in ${outputLanguage}] ${context}`
      : context;

    const result = await this.llm.chatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ]);

    return result ?? fallback;
  }

  private async chooseAssignment(
    managerId: string,
    tasks: Task[],
    workers: Agent[],
  ): Promise<{ task: Task; worker: Agent } | null> {
    if (this.llmDecisionUsedThisTick || !this.llm.hasProviders()) {
      return null;
    }

    const manager = this.agents.getById(managerId);
    if (!manager) return null;

    const candidateTasks = tasks.slice(0, 8);
    const candidateWorkers = workers.slice(0, 8);
    if (candidateTasks.length === 0 || candidateWorkers.length === 0) {
      return null;
    }

    this.llmDecisionUsedThisTick = true;
    const prompts = getAgentPrompts();

    const result = await this.llm.chatCompletion([
      {
        role: 'system',
        content: prompts.managerAssignment.systemPrompt,
      },
      {
        role: 'user',
        content: this.buildAssignmentPrompt(manager, candidateTasks, candidateWorkers),
      },
    ]);

    const parsed = parseJsonObject<{ taskId?: string; workerId?: string }>(result);
    if (!parsed?.taskId || !parsed.workerId) {
      return null;
    }

    const task = candidateTasks.find((candidate) => candidate.id === parsed.taskId);
    const worker = candidateWorkers.find((candidate) => candidate.id === parsed.workerId);
    if (!task || !worker) {
      return null;
    }

    if (!this.isWorkerEligibleForTask(task, worker)) {
      return null;
    }

    return { task, worker };
  }

  /**
   * PM proposes new tasks via LLM based on current team/project context.
   * Tasks are queued for the PjM to create on the next tick.
   * Generates enough tasks to keep all idle workers busy, covering all project layers.
   */
  private async proposeNewTasks(agentId: string): Promise<boolean> {
    if (this.llmPlanningUsedThisTick) {
      console.log('[PM] proposeNewTasks blocked: llmPlanningUsedThisTick');
      return false;
    }
    if (!this.llm.hasProviders()) {
      console.log('[PM] proposeNewTasks blocked: no LLM providers');
      return false;
    }

    const agent = this.agents.getById(agentId);
    if (!agent) return false;

    const prompts = getAgentPrompts();
    const agentPrompt = prompts.roles[agent.role];
    const outputLanguage = getPromptOutputLanguage(getLocale());
    const allProjects = this.projects.getAll();
    const allAgents = this.agents.getAll();
    const allTasks = this.tasks.getAll();
    const workers = allAgents.filter(
      (a) => a.role !== AgentRole.PRODUCT_MANAGER && a.role !== AgentRole.PROJECT_MANAGER,
    );
    const idleWorkers = workers.filter((w) => !w.currentTaskId);

    // Collect unique skills from the team with role info
    const teamSkills = new Set<string>();
    for (const worker of workers) {
      const profile = AGENT_PROFILES[worker.role];
      for (const skill of profile.skills) {
        teamSkills.add(skill);
      }
    }

    // Build detailed worker lines with skills
    const workerLines = workers.map((w) => {
      const profile = AGENT_PROFILES[w.role];
      const wp = prompts.roles[w.role];
      const status = w.currentTaskId ? 'busy' : 'idle';
      return `- ${w.name} (${wp.label}) [${status}] skills: ${profile.skills.join(', ')}`;
    });

    // Build detailed project lines WITH folder info
    const projectLines: string[] = [];
    for (const p of allProjects) {
      projectLines.push(`- ${p.name}: ${p.description || 'no description'}`);
      if (p.folders.length > 0) {
        for (const folder of p.folders) {
          projectLines.push(`  - folder: ${folder.type} — ${folder.label} (${folder.path})`);
        }
      }
    }
    if (projectLines.length === 0) {
      projectLines.push('- no projects defined');
    }

    // Existing tasks to avoid duplicates
    const existingTaskLines: string[] = [];
    const nonDoneTasks = allTasks.filter((task) => task.status !== TaskStatus.DONE);
    if (nonDoneTasks.length > 0) {
      for (const task of nonDoneTasks.slice(0, 15)) {
        existingTaskLines.push(`- "${task.title}" (${task.status}, ${task.priority})`);
      }
    }

    // Pick first project as default for created tasks
    const defaultProjectId = allProjects.length > 0 ? allProjects[0].id : null;

    // Calculate how many tasks to request: at least as many as idle workers, min 4, max 8
    const minTasks = Math.max(4, idleWorkers.length);
    const maxTasks = Math.min(8, minTasks + 2);

    this.llmPlanningUsedThisTick = true;

    const userContentParts = [
      interpolate(prompts.taskProposal.intro, {
        managerName: agent.name,
        managerRole: agentPrompt.label,
      }),
      prompts.taskProposal.instruction,
      interpolate(prompts.taskProposal.skillsGuidance, {
        skills: Array.from(teamSkills).join(', '),
      }),
      prompts.taskProposal.projectsHeader,
      ...projectLines,
      prompts.taskProposal.teamHeader,
      ...workerLines,
    ];

    // Add existing tasks or "no tasks" message
    if (existingTaskLines.length > 0) {
      userContentParts.push(prompts.taskProposal.existingTasksHeader);
      userContentParts.push(...existingTaskLines);
    } else {
      userContentParts.push(prompts.taskProposal.noExistingTasks);
    }

    // Reinforce language in user message for non-English locales
    const locale = getLocale();
    let userContent = userContentParts.join('\n');
    if (locale !== 'en') {
      userContent = `[Write all task titles and descriptions in ${outputLanguage}]\n${userContent}`;
    }

    const result = await this.llm.chatCompletion(
      [
        {
          role: 'system',
          content: interpolate(prompts.taskProposal.systemPrompt, {
            outputLanguage,
            minTasks,
            maxTasks,
          }),
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      { maxTokens: 1024, temperature: 0.7 },
    );

    console.log(`[PM] LLM response received, length=${result?.length ?? 0}`);
    if (result) {
      console.log(`[PM] LLM raw response: ${result.substring(0, 200)}...`);
    }

    const parsed = parseJsonObject<{
      tasks?: Array<{
        title?: string;
        description?: string;
        priority?: string;
        requiredSkills?: string[];
      }>;
    }>(result);

    console.log(`[PM] Parsed tasks count: ${parsed?.tasks?.length ?? 0}`);

    // Validate requiredSkills against actual team skills
    const validSkills = teamSkills;
    const proposedTasks = (parsed?.tasks ?? [])
      .map((task) => ({
        title: task.title?.trim() ?? '',
        description: task.description?.trim() ?? '',
        priority: normalizeTaskPriority(task.priority),
        requiredSkills: Array.isArray(task.requiredSkills)
          ? task.requiredSkills.filter((s) => validSkills.has(s))
          : [],
        projectId: defaultProjectId,
      }))
      .filter((task) => task.title && task.description)
      .slice(0, maxTasks);

    console.log(`[PM] Valid proposed tasks: ${proposedTasks.length}`);
    for (const task of proposedTasks) {
      console.log(`  - "${task.title}" [${task.priority}] skills=${task.requiredSkills.join(',')}`);
    }

    if (proposedTasks.length === 0) {
      return false;
    }

    // Queue proposals for PjM
    this.taskProposals = proposedTasks;
    this.proposalFromAgentId = agentId;

    // PM announces the proposal to PjM in chat
    const s = t().sim;
    const taskTitles = proposedTasks.map((task) => `"${task.title}"`).join(', ');
    const pjm = this.agents.getAll().find((a) => a.role === AgentRole.PROJECT_MANAGER);
    const announce = await this.generateChat(
      agentId,
      interpolate(s.pmProposalContext, { count: proposedTasks.length }),
      interpolate(s.pmProposalAnnounce, { tasks: taskTitles }),
    );
    this.agents.agentChat(agentId, pjm?.id ?? null, announce);
    this.agents.updateAgent(agentId, { status: AgentStatus.TALKING });
    return true;
  }

  private async planEpicBreakdown(agentId: string): Promise<boolean> {
    if (this.llmPlanningUsedThisTick || !this.llm.hasProviders()) {
      return false;
    }

    const agent = this.agents.getById(agentId);
    if (!agent || agent.role !== AgentRole.PRODUCT_MANAGER) {
      return false;
    }

    const epic = this.findEpicToPlan();
    if (!epic || !epic.projectId) {
      return false;
    }

    const project = this.projects.getById(epic.projectId);
    if (!project) {
      return false;
    }

    this.llmPlanningUsedThisTick = true;

    const generatedTasks =
      (await this.generateEpicTasks(agent, project, epic)) ??
      this.buildFallbackEpicTasks(epic);

    if (generatedTasks.length === 0) {
      return false;
    }

    const createdTaskIds: string[] = [];
    for (const generated of generatedTasks) {
      const created = this.tasks.create({
        title: generated.title,
        description: generated.description,
        type: TaskType.TASK,
        epicId: epic.id,
        priority: generated.priority,
        projectId: epic.projectId,
        squadId: epic.squadId ?? undefined,
        requiredSkills: [
          'roadmap',
          'user-stories',
          'prioritization',
          'stakeholder-mgmt',
        ],
      });
      createdTaskIds.push(created.id);
    }

    this.tasks.update(epic.id, {
      subtasks: [...epic.subtasks, ...createdTaskIds],
    });

    const s = t().sim;
    const announce = await this.generateChat(
      agentId,
      interpolate(s.ctxEpicAnnounceContext, { epic: epic.title, count: createdTaskIds.length }),
      interpolate(s.ctxEpicAnnounceFallback, { epic: epic.title, count: createdTaskIds.length }),
    );
    this.agents.agentChat(agentId, null, announce, epic.id);
    return true;
  }

  private findEpicToPlan(): Task | null {
    const tasks = this.tasks.getAll();
    const epics = tasks.filter((task) =>
      task.type === TaskType.EPIC &&
      !!task.projectId &&
      task.status !== TaskStatus.DONE &&
      task.subtasks.length === 0 &&
      !tasks.some((candidate) => candidate.epicId === task.id),
    );

    if (epics.length === 0) {
      return null;
    }

    return epics.sort((a, b) => a.createdAt - b.createdAt)[0];
  }

  private async generateEpicTasks(
    agent: Agent,
    project: Project,
    epic: Task,
  ): Promise<Array<{ title: string; description: string; priority: TaskPriority }> | null> {
    const prompts = getAgentPrompts();
    const agentPrompt = prompts.roles[agent.role];
    const outputLanguage = getPromptOutputLanguage(getLocale());

    let epicUserContent = this.buildEpicBreakdownPrompt(agent, agentPrompt.label, project, epic);
    if (getLocale() !== 'en') {
      epicUserContent = `[Write all content in ${outputLanguage}]\n${epicUserContent}`;
    }

    const result = await this.llm.chatCompletion(
      [
        {
          role: 'system',
          content: interpolate(prompts.epicBreakdown.systemPrompt, {
            outputLanguage,
          }),
        },
        {
          role: 'user',
          content: epicUserContent,
        },
      ],
      { maxTokens: 800, temperature: 0.7 },
    );

    const parsed = parseJsonObject<{ tasks?: Array<{ title?: string; description?: string; priority?: string }> }>(result);
    const generatedTasks = parsed?.tasks ?? [];

    return generatedTasks
      .map((task) => ({
        title: task.title?.trim() ?? '',
        description: task.description?.trim() ?? '',
        priority: normalizeTaskPriority(task.priority),
      }))
      .filter((task) => task.title && task.description)
      .slice(0, 5);
  }

  private buildEpicBreakdownPrompt(
    manager: Agent,
    managerRole: string,
    project: Project,
    epic: Task,
  ): string {
    const prompts = getAgentPrompts();
    const folderLines = project.folders.length > 0
      ? project.folders.map((folder) => `- ${folder.type}: ${folder.label} (${folder.path})`)
      : ['- none'];

    return [
      interpolate(prompts.epicBreakdown.intro, {
        managerName: manager.name,
        managerRole,
      }),
      prompts.epicBreakdown.instruction,
      prompts.epicBreakdown.productConstraint,
      prompts.epicBreakdown.projectHeader,
      `- name=${project.name}`,
      `- description=${project.description || 'none'}`,
      prompts.epicBreakdown.epicHeader,
      `- title=${epic.title}`,
      `- description=${epic.description || 'none'}`,
      prompts.epicBreakdown.foldersHeader,
      ...folderLines,
    ].join('\n');
  }

  private buildFallbackEpicTasks(
    epic: Task,
  ): Array<{ title: string; description: string; priority: TaskPriority }> {
    const s = t().sim;
    return [
      {
        title: interpolate(s.epicFallbackScopeTitle, { epic: epic.title }),
        description: interpolate(s.epicFallbackScopeDesc, { epic: epic.title }),
        priority: TaskPriority.HIGH,
      },
      {
        title: interpolate(s.epicFallbackValidationTitle, { epic: epic.title }),
        description: interpolate(s.epicFallbackValidationDesc, { epic: epic.title }),
        priority: TaskPriority.MEDIUM,
      },
      {
        title: interpolate(s.epicFallbackMetricsTitle, { epic: epic.title }),
        description: interpolate(s.epicFallbackMetricsDesc, { epic: epic.title }),
        priority: TaskPriority.MEDIUM,
      },
    ];
  }

  private buildAssignmentPrompt(manager: Agent, tasks: Task[], workers: Agent[]): string {
    const prompts = getAgentPrompts();
    const managerPrompt = prompts.roles[manager.role];
    const taskLines = tasks.map((task) => {
      const requiredSkills =
        task.requiredSkills.length > 0 ? task.requiredSkills.join(', ') : 'none';
      const description = task.description.trim() || 'none';
      return `- id=${task.id}; title=${task.title}; priority=${task.priority}; project=${task.projectId ?? 'none'}; squad=${task.squadId ?? 'none'}; requiredSkills=${requiredSkills}; description=${description}`;
    });
    const workerLines = workers.map((worker) => {
      const profile = AGENT_PROFILES[worker.role];
      const workerPrompt = prompts.roles[worker.role];
      return `- id=${worker.id}; name=${worker.name}; role=${workerPrompt.label}; skills=${profile.skills.join(', ')}; status=${worker.status}`;
    });

    return [
      interpolate(prompts.managerAssignment.intro, {
        managerName: manager.name,
        managerRole: managerPrompt.label,
      }),
      prompts.managerAssignment.instruction,
      prompts.managerAssignment.priorityGuidance,
      prompts.managerAssignment.tasksHeader,
      ...taskLines,
      prompts.managerAssignment.workersHeader,
      ...workerLines,
    ].join('\n');
  }

  private sendSystemMessage(content: string) {
    this.agents.sendMessage({
      id: uuid(),
      fromAgentId: 'system',
      toAgentId: null,
      type: MessageType.SYSTEM,
      content,
      taskId: null,
      timestamp: Date.now(),
    });
  }

  private findFallbackAssignment(
    tasks: Task[],
    workers: Agent[],
  ): { task: Task; worker: Agent } | null {
    for (const task of tasks) {
      const eligibleWorkers = workers.filter((worker) =>
        this.isWorkerEligibleForTask(task, worker),
      );
      if (eligibleWorkers.length > 0) {
        return { task, worker: eligibleWorkers[0] };
      }
    }
    return null;
  }

  private isWorkerEligibleForTask(task: Task, worker: Agent): boolean {
    if (task.type !== TaskType.TASK) {
      return false;
    }

    if (task.requiredSkills.length === 0) {
      return true;
    }

    const workerSkills = new Set(AGENT_PROFILES[worker.role].skills);
    return task.requiredSkills.some((skill) => workerSkills.has(skill));
  }
}

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

function parseJsonObject<T>(raw: string | null): T | null {
  if (!raw) return null;

  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;

    try {
      return JSON.parse(match[0]) as T;
    } catch {
      return null;
    }
  }
}

function normalizeTaskPriority(priority: string | undefined): TaskPriority {
  if (
    priority === TaskPriority.LOW ||
    priority === TaskPriority.MEDIUM ||
    priority === TaskPriority.HIGH ||
    priority === TaskPriority.CRITICAL
  ) {
    return priority;
  }

  return TaskPriority.MEDIUM;
}
