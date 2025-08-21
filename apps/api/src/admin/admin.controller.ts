import {
  Controller,
  Get,
  UseGuards,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateClinicDto } from '../clinics/dto/create-clinic.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('users')
  @Roles('WEBMASTER')
  @HttpCode(HttpStatus.CREATED)
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  @Patch('users/:id')
  @Roles('WEBMASTER')
  updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: Partial<CreateUserDto>,
  ) {
    return this.adminService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  @Roles('WEBMASTER')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeUser(@Param('id') id: string) {
    return this.adminService.removeUser(id);
  }

  @Patch('clinics/:id')
  @Roles('WEBMASTER')
  updateClinic(
    @Param('id') id: string,
    @Body() updateClinicDto: Partial<CreateClinicDto>,
  ) {
    return this.adminService.updateClinic(id, updateClinicDto);
  }

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
