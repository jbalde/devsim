import { Controller, Post, Get } from '@nestjs/common';
import { SimulationService } from './simulation.service';

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
}
