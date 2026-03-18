import { Module } from '@nestjs/common';
import { SquadsService } from './squads.service';
import { SquadsController } from './squads.controller';

@Module({
  providers: [SquadsService],
  controllers: [SquadsController],
  exports: [SquadsService],
})
export class SquadsModule {}
