import { Controller, Post, Get, Body } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { setLocale, getLocale } from '@devsim/shared';
import type { Locale } from '@devsim/shared';

@Controller('simulation')
export class SimulationController {
  constructor(private sim: SimulationService) {}

  @Post('start')
  start() {
    this.sim.start();
    return { running: true };
  }

  @Post('stop')
  stop() {
    this.sim.stop();
    return { running: false };
  }

  @Get('status')
  status() {
    return { running: this.sim.isRunning() };
  }

  @Get('locale')
  getLocale() {
    return { locale: getLocale() };
  }

  @Post('locale')
  changeLocale(@Body() body: { locale: Locale }) {
    setLocale(body.locale);
    return { locale: getLocale() };
  }
}
