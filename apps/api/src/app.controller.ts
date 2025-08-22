import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

@Controller()
@ApiTags('root')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: "Accueil de l'API",
    description: "Endpoint racine de l'API VitaVet",
  })
  @ApiOkResponse({
    description: 'Message de bienvenue',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Hello World!' },
        api: { type: 'string', example: 'VitaVet API' },
        version: { type: 'string', example: '1.0.0' },
      },
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }
}
