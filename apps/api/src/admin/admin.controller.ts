import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Roles('WEBMASTER')
  findAllUsers() {
    return this.adminService.findAllUsers();
  }

  @Get('clinics')
  @Roles('WEBMASTER')
  findAllClinics() {
    return this.adminService.findAllClinics();
  }
}
