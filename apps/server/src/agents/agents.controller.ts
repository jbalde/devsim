import { Controller, Get, Post, Delete, Param, Body, Patch } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { Agent, AgentRole } from '@devsim/shared';

@Controller('agents')
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  @Get()
  getAll(): Agent[] {
    return this.agentsService.getAll();
  }

  @Post('hire')
  hire(@Body('role') role: AgentRole): Agent {
    return this.agentsService.hire(role);
  }

  @Delete(':id')
  fire(@Param('id') id: string): { ok: boolean } {
    return { ok: this.agentsService.fire(id) };
  }

  @Patch(':id/position')
  updatePosition(
    @Param('id') id: string,
    @Body() position: { x: number; y: number },
  ) {
    return this.agentsService.updateAgent(id, { position });
  }

  @Get('messages')
  getMessages() {
    return this.agentsService.getMessages();
  }
}
