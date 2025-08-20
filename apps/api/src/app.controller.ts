import { Controller, ForbiddenException, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  getTest() {
    return {
      message: 'Test endpoint for rate limiting',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('debug-sentry')
  getSentryError() {
    // Only allow in non-production environments
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException(
        'Access to debug-sentry is forbidden in production.',
      );
    }
    throw new Error('Sentry test exception');
  }
}
