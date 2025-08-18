import { Controller, Post, Param, UseGuards, Get, Query } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RemindersService } from './reminders.service';

@Controller('reminders')
@UseGuards(ThrottlerGuard, JwtAuthGuard, RolesGuard)
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('plan/appointment/:id')
  @Roles('ASV', 'VET', 'ADMIN_CLINIC')
  async planForAppointment(@Param('id') id: string) {
    await this.remindersService.planAppointmentReminders(id);
    return { planned: true };
  }

  @Post('run-due')
  @Roles('ADMIN_CLINIC', 'VET')
  async runDue() {
    const processed = await this.remindersService.processDueReminders();
    return { processed };
  }

  @Get('instances')
  @Roles('ADMIN_CLINIC', 'VET')
  async listInstances(
    @Query('status') status?: 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED',
  ) {
    return this.remindersService.listInstances(status);
  }
}
