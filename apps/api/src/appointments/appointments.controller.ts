import { Controller, Post, Body, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('appointments')
@UseGuards(ThrottlerGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  async createAppointment(@Body() createDto: CreateAppointmentDto) {
    // TODO: Get userId from JWT token when auth is implemented
    const createdByUserId = '550e8400-e29b-41d4-a716-446655440000'; // Mock user for now
    
    const appointment = await this.appointmentsService.createAppointment(
      createDto,
      createdByUserId,
    );

    // TODO: Send confirmation email
    console.log(`Appointment created: ${appointment.id} for ${appointment.startsAt}`);

    return {
      ...appointment,
      message: 'Appointment created successfully. Pending confirmation.',
    };
  }

  @Get('pending')
  async getPendingAppointments() {
    return this.appointmentsService.getPendingAppointments();
  }

  @Patch(':id/confirm')
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
