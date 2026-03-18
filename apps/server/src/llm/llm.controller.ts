import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LlmProvider } from '@devsim/shared';

@Controller('llm/providers')
export class LlmController {
  constructor(private llmService: LlmService) {}

  @Get()
  getAll(): LlmProvider[] {
    return this.llmService.getAll();
  }

  @Post()
  create(@Body() body: Omit<LlmProvider, 'id' | 'status'>) {
    return this.llmService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<LlmProvider>) {
    return this.llmService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return { ok: this.llmService.delete(id) };
  }

  @Post('reorder')
  reorder(@Body() body: { ids: string[] }) {
    return this.llmService.reorder(body.ids);
  }

  @Post(':id/health')
  checkHealth(@Param('id') id: string) {
    return this.llmService.checkHealth(id);
  }

  @Post('health')
  checkAllHealth() {
    return this.llmService.checkAllHealth();
  }
}
