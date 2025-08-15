import { Controller, Get, Query, Post } from '@nestjs/common';
import { ClinicsService } from './clinics.service';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  async search(@Query('postcode') postcode?: string) {
    const results = await this.clinicsService.searchByPostcode(postcode ?? '');
    return results.map((c) => ({
      id: c.id,
      name: c.name,
      city: c.city,
      postcode: c.postcode,
    }));
  }

  @Post('seed')
  async seedDemoData() {
    await this.clinicsService.seedDemoData();
    return { message: 'Demo data seeded successfully' };
  }
}
