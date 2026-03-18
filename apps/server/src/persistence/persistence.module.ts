import { Module } from '@nestjs/common';
import { PersistenceService } from './persistence.service';
import { JsonStore } from './json-store';
import { PERSISTENCE_STORE } from './store.interface';
import { AgentsModule } from '../agents/agents.module';
import { TasksModule } from '../tasks/tasks.module';
import { SquadsModule } from '../squads/squads.module';
import { CompanyModule } from '../company/company.module';
import { LlmModule } from '../llm/llm.module';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [AgentsModule, TasksModule, SquadsModule, CompanyModule, LlmModule, ProjectsModule],
  providers: [
    PersistenceService,
    {
      provide: PERSISTENCE_STORE,
      useClass: JsonStore,
    },
  ],
  exports: [PersistenceService],
})
export class PersistenceModule {}
