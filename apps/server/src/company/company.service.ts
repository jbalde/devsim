import { Injectable } from '@nestjs/common';
import { Company, WsEvent } from '@devsim/shared';
import { EventsGateway } from '../events/events.gateway';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CompanyService {
  private company: Company;

  constructor(private events: EventsGateway) {
    this.company = {
      id: uuid(),
      name: 'My Startup',
      budget: 1000,
      totalTokensUsed: 0,
      tickCount: 0,
      isRunning: false,
      createdAt: Date.now(),
    };
  }

  get(): Company {
    return this.company;
  }

  update(partial: Partial<Company>): Company {
    Object.assign(this.company, partial);
    this.events.emit(WsEvent.COMPANY_UPDATED, this.company);
    return this.company;
  }

  tick() {
    this.company.tickCount++;
  }

  spendBudget(amount: number) {
    this.company.budget -= amount;
  }

  addTokensUsed(tokens: number) {
    this.company.totalTokensUsed += tokens;
  }
}
