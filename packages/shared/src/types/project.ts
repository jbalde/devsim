export const ProjectFolderType = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  DOCS: 'docs',
  CONFIG: 'config',
  OTHER: 'other',
} as const;

export type ProjectFolderType =
  (typeof ProjectFolderType)[keyof typeof ProjectFolderType];

export interface ProjectFolder {
  label: string;
  path: string;
  type: ProjectFolderType;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  folders: ProjectFolder[];
  createdAt: number;
}
