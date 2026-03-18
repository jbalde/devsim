export const TaskStatus = {
  BACKLOG: 'backlog',
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  IN_REVIEW: 'in_review',
  DONE: 'done',
} as const;

export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const;

export type TaskPriority = (typeof TaskPriority)[keyof typeof TaskPriority];

export const TaskType = {
  EPIC: 'epic',
  TASK: 'task',
} as const;

export type TaskType = (typeof TaskType)[keyof typeof TaskType];

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  epicId: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  projectId: string | null;
  squadId: string | null;
  requiredSkills: string[];
  estimatedTicks: number;
  elapsedTicks: number;
  subtasks: string[];
  createdAt: number;
  completedAt: number | null;
}
