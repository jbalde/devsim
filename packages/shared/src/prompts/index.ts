import agentPromptsEs from './agent-prompts.es.json';
import agentPromptsEn from './agent-prompts.en.json';
import { Locale } from '../i18n/types';
import { getLocale } from '../i18n';
import type { AgentPromptCatalog } from './types';

const promptsByLocale: Record<Locale, AgentPromptCatalog> = {
  es: agentPromptsEs as AgentPromptCatalog,
  en: agentPromptsEn as AgentPromptCatalog,
};

export function getAgentPrompts(locale?: Locale): AgentPromptCatalog {
  const l = locale ?? getLocale();
  return promptsByLocale[l] ?? promptsByLocale.en;
}

export function getPromptOutputLanguage(locale: Locale): string {
  const prompts = getAgentPrompts(locale);
  return prompts.outputLanguageByLocale[locale] ?? prompts.outputLanguageByLocale.en;
}

export type {
  AgentPromptCatalog,
  AgentPromptChatDefinition,
  AgentPromptEpicBreakdownDefinition,
  AgentPromptManagerAssignmentDefinition,
  AgentPromptRoleDefinition,
  AgentPromptTaskProposalDefinition,
} from './types';
