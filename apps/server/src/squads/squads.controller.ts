import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { SquadsService } from './squads.service';
import { Squad } from '@devsim/shared';

@Controller('squads')
export class SquadsController {
  constructor(private squadsService: SquadsService) {}

  @Get()
  getAll(): Squad[] {
    return this.squadsService.getAll();
  }

  @Post()
  create(@Body() body: { name: string; position?: { x: number; y: number } }): Squad {
    return this.squadsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<Squad>) {
    return this.squadsService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return { ok: this.squadsService.delete(id) };
  }

  @Post(':id/members/:agentId')
  addMember(@Param('id') id: string, @Param('agentId') agentId: string) {
    return this.squadsService.addMember(id, agentId);
  }

  @Delete(':id/members/:agentId')
  removeMember(@Param('id') id: string, @Param('agentId') agentId: string) {
    return this.squadsService.removeMember(id, agentId);
  }
}
