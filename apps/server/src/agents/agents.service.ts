import { Injectable, Inject, forwardRef } from '@nestjs/common';
import {
  Agent,
  AgentRole,
  AgentStatus,
  AgentMessage,
  MessageType,
  AGENT_PROFILES,
  WsEvent,
} from '@devsim/shared';
import { EventsGateway } from '../events/events.gateway';
import { SquadsService } from '../squads/squads.service';
import { v4 as uuid } from 'uuid';

const NAMES: Record<AgentRole, string[]> = {
  [AgentRole.PRODUCT_MANAGER]: ['Sara', 'Miguel'],
  [AgentRole.PROJECT_MANAGER]: ['Laura', 'Carlos'],
  [AgentRole.FRONTEND_DEV]: ['Ana', 'Pedro'],
  [AgentRole.BACKEND_DEV]: ['Luis', 'María'],
  [AgentRole.FULLSTACK_DEV]: ['Diego', 'Sofía'],
  [AgentRole.BI_ANALYST]: ['Paula', 'Jorge'],
  [AgentRole.SECURITY_ENGINEER]: ['Elena', 'Raúl'],
  [AgentRole.QA_ENGINEER]: ['Marta', 'David'],
  [AgentRole.DEVOPS_ENGINEER]: ['Andrés', 'Lucía'],
  [AgentRole.UX_DESIGNER]: ['Camila', 'Tomás'],
};

@Injectable()
export class AgentsService {
  private agents = new Map<string, Agent>();
  private messages: AgentMessage[] = [];

  constructor(
    private events: EventsGateway,
    @Inject(forwardRef(() => SquadsService)) private squads: SquadsService,
  ) {}

  hire(role: AgentRole): Agent {
    const profile = AGENT_PROFILES[role];
    const names = NAMES[role];
    const name = names[Math.floor(Math.random() * names.length)];

    const agent: Agent = {
      id: uuid(),
      name,
      role,
      status: AgentStatus.IDLE,
      currentTaskId: null,
      position: { x: 100 + this.agents.size * 120, y: 200 },
      tokensUsed: 0,
      messagesSent: 0,
      createdAt: Date.now(),
    };

    this.agents.set(agent.id, agent);
    this.events.emit(WsEvent.AGENT_HIRED, agent);

    // System message
    this.sendMessage({
      id: uuid(),
      fromAgentId: agent.id,
      toAgentId: null,
      type: MessageType.SYSTEM,
      content: `${name} (${profile.label}) has joined the team!`,
      taskId: null,
      timestamp: Date.now(),
    });

    return agent;
  }

  fire(agentId: string): boolean {
    const agent = this.agents.get(agentId);
    if (!agent) return false;
    this.agents.delete(agentId);
    this.squads.removeAgentFromAll(agentId);
    this.events.emit(WsEvent.AGENT_FIRED, { id: agentId });
    return true;
  }

  getAll(): Agent[] {
    return Array.from(this.agents.values());
  }

  getById(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  updateAgent(id: string, partial: Partial<Agent>): Agent | undefined {
    const agent = this.agents.get(id);
    if (!agent) return undefined;
    Object.assign(agent, partial);
    this.events.emit(WsEvent.AGENT_UPDATED, agent);
    return agent;
  }

  getByRole(role: AgentRole): Agent[] {
    return this.getAll().filter((a) => a.role === role);
  }

  sendMessage(msg: AgentMessage) {
    this.messages.push(msg);
    const sender = this.agents.get(msg.fromAgentId);
    if (sender) {
      sender.messagesSent++;
    }
    this.events.emit(WsEvent.MESSAGE_SENT, msg);
  }

  getMessages(limit = 50): AgentMessage[] {
    return this.messages.slice(-limit);
  }

  /** Agents talk to each other — used by simulation engine */
  agentChat(fromId: string, toId: string | null, content: string, taskId: string | null = null) {
    this.sendMessage({
      id: uuid(),
      fromAgentId: fromId,
      toAgentId: toId,
      type: MessageType.CHAT,
      content,
      taskId,
      timestamp: Date.now(),
    });
  }
}
