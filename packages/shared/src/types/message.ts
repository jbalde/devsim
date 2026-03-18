export const MessageType = {
  CHAT: 'chat',
  TASK_UPDATE: 'task_update',
  REQUEST_HELP: 'request_help',
  REVIEW_REQUEST: 'review_request',
  BLOCKER: 'blocker',
  SYSTEM: 'system',
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string | null;
  type: MessageType;
  content: string;
  taskId: string | null;
  timestamp: number;
}
