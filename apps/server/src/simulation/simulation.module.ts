import { Module } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { SimulationController } from './simulation.controller';
import { AgentsModule } from '../agents/agents.module';
import { TasksModule } from '../tasks/tasks.module';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [AgentsModule, TasksModule, CompanyModule],
  providers: [SimulationService],
  controllers: [SimulationController],
})
export class SimulationModule {}
