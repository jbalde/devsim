import { Module } from '@nestjs/common';
import { CompanyModule } from './company/company.module';
import { AgentsModule } from './agents/agents.module';
import { TasksModule } from './tasks/tasks.module';
import { SimulationModule } from './simulation/simulation.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    EventsModule,
    CompanyModule,
    AgentsModule,
    TasksModule,
    SimulationModule,
  ],
})
export class AppModule {}
