import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Task, TaskPriority } from '@devsim/shared';

@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get()
  getAll(): Task[] {
    return this.tasksService.getAll();
  }

  @Post()
  create(
    @Body() body: { title: string; description: string; priority?: TaskPriority; requiredSkills?: string[]; estimatedTicks?: number },
  ): Task {
    return this.tasksService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<Task>) {
    return this.tasksService.update(id, body);
  }
}
