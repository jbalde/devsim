import { Injectable } from '@nestjs/common';
import { Project, ProjectFolder, WsEvent } from '@devsim/shared';
import { EventsGateway } from '../events/events.gateway';
import { v4 as uuid } from 'uuid';

@Injectable()
export class ProjectsService {
  private projects = new Map<string, Project>();

  constructor(private events: EventsGateway) {}

  create(data: { name: string; description: string; folders?: ProjectFolder[] }): Project {
    const project: Project = {
      id: uuid(),
      name: data.name,
      description: data.description || '',
      folders: data.folders ?? [],
      createdAt: Date.now(),
    };
    this.projects.set(project.id, project);
    this.events.emit(WsEvent.PROJECT_CREATED, project);
    return project;
  }

  getAll(): Project[] {
    return Array.from(this.projects.values());
  }

  getById(id: string): Project | undefined {
    return this.projects.get(id);
  }

  update(id: string, partial: Partial<Project>): Project | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;
    Object.assign(project, partial);
    this.events.emit(WsEvent.PROJECT_UPDATED, project);
    return project;
  }

  delete(id: string): boolean {
    const deleted = this.projects.delete(id);
    if (deleted) {
      this.events.emit(WsEvent.PROJECT_DELETED, { id });
    }
    return deleted;
  }

  /** Restore state from persistence */
  restore(projects: Project[]) {
    this.projects.clear();
    for (const p of projects) {
      this.projects.set(p.id, p);
    }
  }
}
