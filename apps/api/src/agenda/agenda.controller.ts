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
    @Query('range') range: 'day' | 'week' | 'month' = 'day',
  ): Promise<AgendaItem[]> {
    const target = date ? new Date(date) : new Date();
    if (range === 'week') {
      const start = new Date(target);
      const end = new Date(target);
      // week: Monday 00:00 to Sunday 23:59:59.999 (ISO weeks simplified)
      const day = start.getDay() || 7; // 1..7
      start.setDate(start.getDate() - (day - 1));
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return this.agendaService.getVetRangeAgenda(user.id, start, end);
    }
    if (range === 'month') {
      const start = new Date(target.getFullYear(), target.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(target.getFullYear(), target.getMonth() + 1, 0, 23, 59, 59, 999);
      return this.agendaService.getVetRangeAgenda(user.id, start, end);
    }
    return this.agendaService.getVetDayAgenda(user.id, target);
  }
}
