export const LlmProviderType = {
  OLLAMA: 'ollama',
  LMSTUDIO: 'lmstudio',
  OPENAI: 'openai',
  CUSTOM: 'custom',
} as const;

export type LlmProviderType = (typeof LlmProviderType)[keyof typeof LlmProviderType];

export const LlmProviderStatus = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  UNKNOWN: 'unknown',
} as const;

export type LlmProviderStatus = (typeof LlmProviderStatus)[keyof typeof LlmProviderStatus];

export interface LlmProvider {
  id: string;
  name: string;
  type: LlmProviderType;
  baseUrl: string;
  model: string;
  apiKey?: string;
  priority: number;
  enabled: boolean;
  status: LlmProviderStatus;
}
