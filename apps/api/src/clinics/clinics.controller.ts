import {
  Controller,
  Get,
  Query,
  Post,
  Param,
  UseGuards,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
  Delete,
} from '@nestjs/common';
import { ClinicsService } from './clinics.service';
import { GetVetsDto } from './dto/get-vets.dto';
import { Vet } from './clinics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { Clinic } from './entities/clinic.entity';
import { AssignRoleDto } from './dto/assign-role.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('clinics')
@ApiTags('clinics')
@ApiBearerAuth()
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WEBMASTER')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createClinicDto: CreateClinicDto): Promise<Clinic> {
    return this.clinicsService.create(createClinicDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WEBMASTER')
  update(
    @Param('id') id: string,
    @Body() updateClinicDto: Partial<CreateClinicDto>,
  ) {
    return this.clinicsService.update(id, updateClinicDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WEBMASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.clinicsService.remove(id);
  }

  @Post(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WEBMASTER', 'ADMIN_CLINIC')
  assignRole(
    @Param('id') clinicId: string,
    @Body() assignRoleDto: AssignRoleDto,
  ) {
    return this.clinicsService.assignRole(clinicId, assignRoleDto);
  }

  @Get(':id/roles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WEBMASTER', 'ADMIN_CLINIC')
  getClinicRoles(@Param('id') clinicId: string) {
    return this.clinicsService.getClinicRoles(clinicId);
  }

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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WEBMASTER', 'ADMIN_CLINIC')
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
