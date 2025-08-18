import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { Document } from '../documents/entities/document.entity';

@Controller('appointments')
@UseGuards(ThrottlerGuard, JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('OWNER', 'VET', 'ASV')
  async createAppointment(
    @Body() createDto: CreateAppointmentDto,
    @CurrentUser() user: User,
  ) {
    const appointment = await this.appointmentsService.createAppointment(
      createDto,
      user.id,
    );

    // TODO: Send confirmation email
    console.log(
      `Appointment created: ${appointment.id} for ${appointment.startsAt}`,
    );

    return {
      ...appointment,
      message: 'Appointment created successfully. Pending confirmation.',
    };
  }

  @Get('pending')
  @Roles('ASV', 'VET', 'ADMIN_CLINIC')
  async getPendingAppointments(
    @Query('clinicId') clinicId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const offsetNum = offset ? parseInt(offset, 10) : 0;

    // Validate pagination parameters
    if (limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }
    if (offsetNum < 0) {
      throw new BadRequestException('Offset must be non-negative');
    }

    return this.appointmentsService.getPendingAppointments(
      clinicId,
      limitNum,
      offsetNum,
    );
  }

  @Get(':id/documents')
  @Roles('VET', 'OWNER') // Or maybe ASV, ADMIN_CLINIC?
  async getAppointmentDocuments(@Param('id') id: string): Promise<Document[]> {
    return this.appointmentsService.findDocumentsByAppointmentId(id);
  }

  @Patch(':id/confirm')
  @Roles('ASV', 'VET', 'ADMIN_CLINIC')
  async confirmAppointment(@Param('id') id: string) {
    const appointment = await this.appointmentsService.confirmAppointment(id);

    // TODO: Send confirmation email
    console.log(`Appointment confirmed: ${appointment.id}`);

    return {
      ...appointment,
      message: 'Appointment confirmed successfully.',
    };
  }

  @Patch(':id/complete')
  @Roles('VET')
  async completeAppointment(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() completeDto: CompleteAppointmentDto,
  ) {
    const appointment = await this.appointmentsService.completeAppointment(
      id,
      user.id,
      completeDto,
    );

    // TODO: Send report email to owner

    return {
      ...appointment,
      message: 'Appointment completed and report saved.',
    };
  }

  // Owner: appointments for their animals (optional status filter)
  @Get('me')
  @Roles('OWNER')
  async getMyAppointments(
    @CurrentUser() user: User,
    @Query('status')
    status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED',
  ) {
    return this.appointmentsService.getOwnerAppointments(user.id, status);
  }
}
