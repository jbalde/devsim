import { Injectable } from '@nestjs/common';
import { Squad, WsEvent } from '@devsim/shared';
import { EventsGateway } from '../events/events.gateway';
import { v4 as uuid } from 'uuid';

const SQUAD_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#f97316'];

@Injectable()
export class SquadsService {
  private squads = new Map<string, Squad>();
  private colorIndex = 0;

  constructor(private events: EventsGateway) {}

  create(data: { name: string; position?: { x: number; y: number } }): Squad {
    const squad: Squad = {
      id: uuid(),
      name: data.name,
      color: SQUAD_COLORS[this.colorIndex++ % SQUAD_COLORS.length],
      memberIds: [],
      position: data.position ?? { x: 100, y: 100 },
      createdAt: Date.now(),
    };
    this.squads.set(squad.id, squad);
    this.events.emit(WsEvent.SQUAD_CREATED, squad);
    return squad;
  }

  getAll(): Squad[] {
    return Array.from(this.squads.values());
  }

  getById(id: string): Squad | undefined {
    return this.squads.get(id);
  }

  update(id: string, partial: Partial<Squad>): Squad | undefined {
    const squad = this.squads.get(id);
    if (!squad) return undefined;
    Object.assign(squad, partial);
    this.events.emit(WsEvent.SQUAD_UPDATED, squad);
    return squad;
  }

  delete(id: string): boolean {
    const deleted = this.squads.delete(id);
    if (deleted) {
      this.events.emit(WsEvent.SQUAD_DELETED, { id });
    }
    return deleted;
  }

  addMember(squadId: string, agentId: string): Squad | undefined {
    const squad = this.squads.get(squadId);
    if (!squad) return undefined;
    // Remove from any other squad first
    for (const s of this.squads.values()) {
      if (s.id !== squadId) {
        s.memberIds = s.memberIds.filter((id) => id !== agentId);
      }
    }
    if (!squad.memberIds.includes(agentId)) {
      squad.memberIds.push(agentId);
    }
    this.events.emit(WsEvent.SQUAD_UPDATED, squad);
    return squad;
  }

  removeMember(squadId: string, agentId: string): Squad | undefined {
    const squad = this.squads.get(squadId);
    if (!squad) return undefined;
    squad.memberIds = squad.memberIds.filter((id) => id !== agentId);
    this.events.emit(WsEvent.SQUAD_UPDATED, squad);
    return squad;
  }

  /** Find which squad an agent belongs to */
  findByAgent(agentId: string): Squad | undefined {
    for (const squad of this.squads.values()) {
      if (squad.memberIds.includes(agentId)) return squad;
    }
    return undefined;
  }

  /** Remove agent from all squads (used when firing) */
  removeAgentFromAll(agentId: string) {
    for (const squad of this.squads.values()) {
      const before = squad.memberIds.length;
      squad.memberIds = squad.memberIds.filter((id) => id !== agentId);
      if (squad.memberIds.length !== before) {
        this.events.emit(WsEvent.SQUAD_UPDATED, squad);
      }
    }
  }

  /** Restore state from persistence */
  restore(squads: Squad[]) {
    this.squads.clear();
    for (const s of squads) {
      this.squads.set(s.id, s);
    }
    this.colorIndex = squads.length;
  }
}
