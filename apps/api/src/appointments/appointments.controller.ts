import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('appointments')
@UseGuards(ThrottlerGuard, JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles('OWNER', 'VET', 'ASV')
  async createAppointment(
    @Body() createDto: CreateAppointmentDto,
    @CurrentUser() user: any,
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
  async getPendingAppointments() {
    return this.appointmentsService.getPendingAppointments();
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
}
