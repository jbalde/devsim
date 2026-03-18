import { Module, forwardRef } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { SquadsModule } from '../squads/squads.module';

@Module({
  imports: [forwardRef(() => SquadsModule)],
  providers: [AgentsService],
  controllers: [AgentsController],
  exports: [AgentsService],
})
export class AgentsModule {}
