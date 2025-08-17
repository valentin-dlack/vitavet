import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AgendaService, AgendaItem } from './agenda.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../users/entities/user.entity';

@Controller('agenda')
@UseGuards(ThrottlerGuard, JwtAuthGuard, RolesGuard)
export class AgendaController {
  constructor(private readonly agendaService: AgendaService) {}

  @Get('me')
  @Roles('VET')
  async getMyAgenda(
    @CurrentUser() user: User,
    @Query('date') date: string,
  ): Promise<AgendaItem[]> {
    // For MVP, only day range is supported
    const target = date ? new Date(date) : new Date();
    return this.agendaService.getVetDayAgenda(user.id, target);
  }
}
