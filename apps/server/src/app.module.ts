import { Module } from '@nestjs/common';
import { CompanyModule } from './company/company.module';
import { AgentsModule } from './agents/agents.module';
import { TasksModule } from './tasks/tasks.module';
import { SquadsModule } from './squads/squads.module';
import { LlmModule } from './llm/llm.module';
import { SimulationModule } from './simulation/simulation.module';
import { EventsModule } from './events/events.module';
import { ProjectsModule } from './projects/projects.module';
import { PersistenceModule } from './persistence/persistence.module';

@Module({
  imports: [
    EventsModule,
    CompanyModule,
    AgentsModule,
    TasksModule,
    SquadsModule,
    LlmModule,
    ProjectsModule,
    SimulationModule,
    PersistenceModule,
  ],
})
export class AppModule {}
