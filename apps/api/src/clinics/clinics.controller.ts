import { Controller, Get, Query, Post, Param } from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { GetVetsDto } from './dto/get-vets.dto';
import { Vet } from './clinics.service';

@Controller('clinics')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  async search(
    @Query('postcode') postcode?: string,
    @Query('services') servicesCsv?: string,
  ) {
    if (postcode || servicesCsv) {
      const serviceSlugs = servicesCsv
        ? servicesCsv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;
      const results = await this.clinicsService.searchByPostcode(
        postcode || '',
        serviceSlugs,
      );
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

  @Get('services/list')
  async listServices() {
    return this.clinicsService.listServices();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const c = await this.clinicsService.getById(id);
    if (!c) return null;
    return {
      id: c.id,
      name: c.name,
      postcode: c.postcode,
      city: c.city,
      addressLine1: c.addressLine1 || null,
      addressLine2: c.addressLine2 || null,
      country: c.country || null,
      phone: c.phone || null,
      email: c.email || null,
      website: c.website || null,
      latitude: c.latitude ?? null,
      longitude: c.longitude ?? null,
      openingHours: c.openingHours || null,
      services: (c.services || []).map((s) => ({
        id: s.id,
        slug: s.slug,
        label: s.label,
      })),
    };
  }
}
