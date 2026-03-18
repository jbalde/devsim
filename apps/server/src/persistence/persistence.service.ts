import { Injectable, Inject, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PERSISTENCE_STORE, PersistenceStore, StoreData } from './store.interface';
import { AgentsService } from '../agents/agents.service';
import { TasksService } from '../tasks/tasks.service';
import { SquadsService } from '../squads/squads.service';
import { CompanyService } from '../company/company.service';
import { LlmService } from '../llm/llm.service';
import { ProjectsService } from '../projects/projects.service';

/** How often to auto-save (ms) */
const AUTO_SAVE_INTERVAL = 30_000; // 30 seconds

@Injectable()
export class PersistenceService implements OnApplicationBootstrap {
  private readonly logger = new Logger(PersistenceService.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Inject(PERSISTENCE_STORE) private store: PersistenceStore,
    private agents: AgentsService,
    private tasks: TasksService,
    private squads: SquadsService,
    private company: CompanyService,
    private llm: LlmService,
    private projects: ProjectsService,
  ) {}

  async onApplicationBootstrap() {
    await this.loadState();
    this.startAutoSave();

    // Save on shutdown signals
    const shutdown = async () => {
      this.logger.log('Saving state before shutdown...');
      await this.saveState();
      process.exit(0);
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  /** Collect snapshot from all services */
  private collectSnapshot(): StoreData {
    return {
      company: this.company.get() as unknown as Record<string, unknown>,
      agents: this.agents.getAll() as unknown as Record<string, unknown>[],
      messages: this.agents.getMessages(10000) as unknown as Record<string, unknown>[],
      tasks: this.tasks.getAll() as unknown as Record<string, unknown>[],
      squads: this.squads.getAll() as unknown as Record<string, unknown>[],
      llmProviders: this.llm.getAll() as unknown as Record<string, unknown>[],
      projects: this.projects.getAll() as unknown as Record<string, unknown>[],
    };
  }

  /** Save current state to disk */
  async saveState(): Promise<void> {
    const snapshot = this.collectSnapshot();
    await this.store.save(snapshot);
    this.logger.debug('State saved');
  }

  /** Load state from disk and restore to services */
  async loadState(): Promise<void> {
    const data = await this.store.load();
    if (!data) return;

    try {
      // Restore company
      if (data.company) {
        this.company.restore(data.company as any);
      }

      // Restore agents
      if (data.agents?.length) {
        this.agents.restore(data.agents as any[], data.messages as any[] ?? []);
      }

      // Restore tasks
      if (data.tasks?.length) {
        this.tasks.restore(data.tasks as any[]);
      }

      // Restore squads
      if (data.squads?.length) {
        this.squads.restore(data.squads as any[]);
      }

      // Restore LLM providers
      if (data.llmProviders?.length) {
        this.llm.restore(data.llmProviders as any[]);
      }

      // Restore projects
      if (data.projects?.length) {
        this.projects.restore(data.projects as any[]);
      }

      this.logger.log('State restored successfully');
    } catch (err) {
      this.logger.error(`Failed to restore state: ${err}`);
    }
  }

  private startAutoSave() {
    this.timer = setInterval(() => {
      this.saveState().catch((err) =>
        this.logger.error(`Auto-save failed: ${err}`),
      );
    }, AUTO_SAVE_INTERVAL);
    this.logger.log(`Auto-save enabled (every ${AUTO_SAVE_INTERVAL / 1000}s)`);
  }
}
