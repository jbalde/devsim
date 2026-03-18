import { Controller, Post } from '@nestjs/common';
import { PersistenceService } from './persistence.service';

@Controller('persistence')
export class PersistenceController {
  constructor(private persistenceService: PersistenceService) {}

  @Post('save')
  async save() {
    await this.persistenceService.saveState();
    return { ok: true };
  }
}
