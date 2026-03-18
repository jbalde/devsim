import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project, ProjectFolder } from '@devsim/shared';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  getAll(): Project[] {
    return this.projectsService.getAll();
  }

  @Post()
  create(
    @Body() body: { name: string; description: string; folders?: ProjectFolder[] },
  ): Project {
    return this.projectsService.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: Partial<Project>) {
    return this.projectsService.update(id, body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return { ok: this.projectsService.delete(id) };
  }
}
