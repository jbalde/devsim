import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskPriority, TaskType } from '@devsim/shared';

@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  getAll(): Task[] {
    return this.tasksService.getAll();
  }

  @Post()
  create(
    @Body() body: { title: string; description: string; type?: TaskType; epicId?: string; priority?: TaskPriority; requiredSkills?: string[]; estimatedTicks?: number; projectId?: string; squadId?: string },
  ): Task {
    return this.tasksService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<Task>) {
    return this.tasksService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return { ok: this.tasksService.delete(id) };
  }
}
