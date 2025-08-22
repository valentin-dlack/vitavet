import { Controller, Get, UseGuards } from '@nestjs/common';
import { HealthService } from './health.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@Controller('health')
@UseGuards()
@ApiTags('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: "Vérifier la santé de l'API",
    description:
      "Endpoint de santé pour vérifier que l'API fonctionne correctement",
  })
  @ApiOkResponse({
    description: 'API en bonne santé',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: {
          type: 'number',
          description: 'Temps de fonctionnement en secondes',
        },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  check() {
    return this.healthService.check();
  }
}
