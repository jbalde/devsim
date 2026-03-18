import { AgentRole } from '../types/agent';
import { Locale } from '../i18n/types';

export interface AgentPromptRoleDefinition {
  label: string;
  description: string;
}

export interface AgentPromptChatDefinition {
  systemPrompt: string;
  contextAssign: string;
  contextAck: string;
  contextWorkUpdate: string;
  contextFinish: string;
  contextReviewReq: string;
  contextReviewReply: string;
  contextIdle: string;
  contextManaging: string;
}

export interface AgentPromptManagerAssignmentDefinition {
  systemPrompt: string;
  intro: string;
  instruction: string;
  priorityGuidance: string;
  tasksHeader: string;
  workersHeader: string;
}

export interface AgentPromptEpicBreakdownDefinition {
  systemPrompt: string;
  intro: string;
  instruction: string;
  productConstraint: string;
  projectHeader: string;
  epicHeader: string;
  foldersHeader: string;
}

export interface AgentPromptTaskProposalDefinition {
  systemPrompt: string;
  intro: string;
  instruction: string;
  skillsGuidance: string;
  projectsHeader: string;
  teamHeader: string;
  existingTasksHeader: string;
  noExistingTasks: string;
}

export interface AgentPromptCatalog {
  outputLanguageByLocale: Record<Locale, string>;
  roles: Record<AgentRole, AgentPromptRoleDefinition>;
  chat: AgentPromptChatDefinition;
  managerAssignment: AgentPromptManagerAssignmentDefinition;
  epicBreakdown: AgentPromptEpicBreakdownDefinition;
  taskProposal: AgentPromptTaskProposalDefinition;
}
