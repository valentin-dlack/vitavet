import { Controller, Get, Query, Post, Param } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { GetVetsDto } from './dto/get-vets.dto';
import { Vet } from './clinics.service';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  async search(@Query('postcode') postcode?: string) {
    if (postcode) {
      const results = await this.clinicsService.searchByPostcode(postcode);
      return results.map((c) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        postcode: c.postcode,
      }));
    } else {
      const results = await this.clinicsService.getAllClinics();
      return results.map((c) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        postcode: c.postcode,
      }));
    }
  }

  @Post('seed')
  async seedDemoData() {
    await this.clinicsService.seedDemoData();
    return { message: 'Demo data seeded successfully' };
  }

  @Get(':clinicId/vets')
  async getVetsByClinic(@Param() params: GetVetsDto): Promise<Vet[]> {
    return this.clinicsService.getVetsByClinic(params.clinicId);
  }
}
