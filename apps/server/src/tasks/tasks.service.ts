import { Injectable } from '@nestjs/common';
import { Task, TaskStatus, TaskPriority, WsEvent } from '@devsim/shared';
import { EventsGateway } from '../events/events.gateway';
import { v4 as uuid } from 'uuid';

@Injectable()
export class TasksService {
  private tasks = new Map<string, Task>();

  constructor(private events: EventsGateway) {}

  create(data: {
    title: string;
    description: string;
    priority?: TaskPriority;
    requiredSkills?: string[];
    estimatedTicks?: number;
    projectId?: string;
    squadId?: string;
  }): Task {
    const task: Task = {
      id: uuid(),
      title: data.title,
      description: data.description,
      status: TaskStatus.BACKLOG,
      priority: data.priority ?? TaskPriority.MEDIUM,
      assigneeId: null,
      projectId: data.projectId ?? null,
      squadId: data.squadId ?? null,
      requiredSkills: data.requiredSkills ?? [],
      estimatedTicks: data.estimatedTicks ?? 5,
      elapsedTicks: 0,
      subtasks: [],
      createdAt: Date.now(),
      completedAt: null,
    };
    this.tasks.set(task.id, task);
    this.events.emit(WsEvent.TASK_CREATED, task);
    return task;
  }

  getAll(): Task[] {
    return Array.from(this.tasks.values());
  }

  getById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  update(id: string, partial: Partial<Task>): Task | undefined {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    Object.assign(task, partial);
    this.events.emit(WsEvent.TASK_UPDATED, task);
    return task;
  }

  delete(id: string): boolean {
    const deleted = this.tasks.delete(id);
    if (deleted) {
      this.events.emit(WsEvent.TASK_DELETED, { id });
    }
    return deleted;
  }

  getUnassigned(): Task[] {
    return this.getAll().filter(
      (t) => !t.assigneeId && t.status !== TaskStatus.DONE,
    );
  }

  getByAssignee(agentId: string): Task[] {
    return this.getAll().filter((t) => t.assigneeId === agentId);
  }

  /** Restore state from persistence */
  restore(tasks: Task[]) {
    this.tasks.clear();
    for (const t of tasks) {
      this.tasks.set(t.id, t);
    }
  }
}
