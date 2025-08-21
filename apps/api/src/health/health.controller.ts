import { Controller, Get, UseGuards } from '@nestjs/common';
import { HealthService } from './health.service';

@Controller('health')
@UseGuards()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check() {
    return this.healthService.check();
  }
}
