import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ThrottlerGuard } from '@nestjs/throttler';
import { User } from '../users/entities/user.entity';

@Controller('animals')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Get('me')
  async getMyAnimals(
    @CurrentUser() user: User,
    @Query('clinicId') clinicId: string,
  ) {
    return this.animalsService.findByOwnerAndClinic(user.id, clinicId);
  }
}
