export interface Company {
  id: string;
  name: string;
  budget: number;
  totalTokensUsed: number;
  tickCount: number;
  isRunning: boolean;
  createdAt: number;
}

export const WsEvent = {
  AGENT_HIRED: 'agent:hired',
  AGENT_UPDATED: 'agent:updated',
  AGENT_FIRED: 'agent:fired',
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  MESSAGE_SENT: 'message:sent',
  TICK: 'simulation:tick',
  COMPANY_UPDATED: 'company:updated',
  SQUAD_CREATED: 'squad:created',
  SQUAD_UPDATED: 'squad:updated',
  SQUAD_DELETED: 'squad:deleted',
  LLM_PROVIDER_CREATED: 'llm:provider:created',
  LLM_PROVIDER_UPDATED: 'llm:provider:updated',
  LLM_PROVIDER_DELETED: 'llm:provider:deleted',
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
} as const;

export type WsEvent = (typeof WsEvent)[keyof typeof WsEvent];
