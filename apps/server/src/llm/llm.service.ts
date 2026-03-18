import { Injectable } from '@nestjs/common';
import { LlmProvider, LlmProviderStatus, WsEvent } from '@devsim/shared';
import { EventsGateway } from '../events/events.gateway';
import { v4 as uuid } from 'uuid';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatOptions {
  /** Max tokens for the response (default: 150) */
  maxTokens?: number;
  /** Temperature (default: 0.8) */
  temperature?: number;
}

@Injectable()
export class LlmService {
  private providers = new Map<string, LlmProvider>();

  constructor(private events: EventsGateway) {}

  // --- Provider CRUD ---

  create(data: Omit<LlmProvider, 'id' | 'status'>): LlmProvider {
    const provider: LlmProvider = {
      ...data,
      id: uuid(),
      status: LlmProviderStatus.UNKNOWN,
    };
    this.providers.set(provider.id, provider);
    this.events.emit(WsEvent.LLM_PROVIDER_CREATED, provider);
    return provider;
  }

  getAll(): LlmProvider[] {
    return Array.from(this.providers.values()).sort((a, b) => a.priority - b.priority);
  }

  getEnabled(): LlmProvider[] {
    return this.getAll().filter((provider) => provider.enabled);
  }

  getById(id: string): LlmProvider | undefined {
    return this.providers.get(id);
  }

  update(id: string, partial: Partial<LlmProvider>): LlmProvider | undefined {
    const provider = this.providers.get(id);
    if (!provider) return undefined;
    Object.assign(provider, partial);
    this.events.emit(WsEvent.LLM_PROVIDER_UPDATED, provider);
    return provider;
  }

  delete(id: string): boolean {
    const deleted = this.providers.delete(id);
    if (deleted) {
      this.events.emit(WsEvent.LLM_PROVIDER_DELETED, { id });
    }
    return deleted;
  }

  reorder(ids: string[]): LlmProvider[] {
    ids.forEach((id, index) => {
      const provider = this.providers.get(id);
      if (provider) {
        provider.priority = index;
        this.events.emit(WsEvent.LLM_PROVIDER_UPDATED, provider);
      }
    });
    return this.getAll();
  }

  // --- Health Check ---

  async checkHealth(id: string): Promise<LlmProvider | undefined> {
    const provider = this.providers.get(id);
    if (!provider) return undefined;

    const reachable = await this.isReachable(provider);
    provider.status = reachable ? LlmProviderStatus.CONNECTED : LlmProviderStatus.DISCONNECTED;
    this.events.emit(WsEvent.LLM_PROVIDER_UPDATED, provider);
    return provider;
  }

  async checkAllHealth(): Promise<LlmProvider[]> {
    const all = this.getAll();
    await Promise.allSettled(all.map((p) => this.checkHealth(p.id)));
    return this.getAll();
  }

  private async isReachable(provider: LlmProvider): Promise<boolean> {
    try {
      const url = `${provider.baseUrl}/v1/models`;
      const headers: Record<string, string> = {};
      if (provider.apiKey) {
        headers['Authorization'] = `Bearer ${provider.apiKey}`;
      }
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  }

  // --- Chat Completion with Fallback ---

  async chatCompletion(messages: ChatMessage[], options?: ChatOptions): Promise<string | null> {
    const sorted = this.getEnabled();
    for (const provider of sorted) {
      try {
        const result = await this.callProvider(provider, messages, options);
        if (result) {
          // Mark as connected on success
          if (provider.status !== LlmProviderStatus.CONNECTED) {
            provider.status = LlmProviderStatus.CONNECTED;
            this.events.emit(WsEvent.LLM_PROVIDER_UPDATED, provider);
          }
          return result;
        }
      } catch {
        // Mark as disconnected and try next provider
        if (provider.status !== LlmProviderStatus.DISCONNECTED) {
          provider.status = LlmProviderStatus.DISCONNECTED;
          this.events.emit(WsEvent.LLM_PROVIDER_UPDATED, provider);
        }
      }
    }
    return null; // All providers failed — caller should use fallback
  }

  private async callProvider(
    provider: LlmProvider,
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<string | null> {
    const url = `${provider.baseUrl}/v1/chat/completions`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (provider.apiKey) {
      headers['Authorization'] = `Bearer ${provider.apiKey}`;
    }

    const maxTokens = options?.maxTokens ?? 150;
    const temperature = options?.temperature ?? 0.8;
    const timeout = maxTokens > 300 ? 30000 : 10000;

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: provider.model,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal: AbortSignal.timeout(timeout),
    });

    if (!res.ok) throw new Error(`Provider ${provider.name} returned ${res.status}`);

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    return content || null;
  }

  /** Whether any enabled provider is available */
  hasProviders(): boolean {
    return this.getEnabled().length > 0;
  }

  /** Restore state from persistence */
  restore(providers: LlmProvider[]) {
    this.providers.clear();
    for (const p of providers) {
      this.providers.set(p.id, p);
    }
  }
}
