import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateAnimalDto } from './dto/create-animal.dto';

@Controller('animals')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Post()
  @Roles('OWNER')
  async createAnimal(
    @CurrentUser() user: User,
    @Body() createDto: CreateAnimalDto,
  ) {
    return this.animalsService.createAnimal(createDto, user.id);
  }

  @Get('me')
  @Roles('OWNER')
  async getMyAnimals(
    @CurrentUser() user: User,
    @Query('clinicId') clinicId?: string,
  ) {
    return this.animalsService.findByOwnerAndClinic(user.id, clinicId);
  }

  // US-05a: View animal history
  // Access: OWNER of the animal, or VET/ASV/ADMIN_CLINIC of the same clinic
  @Get(':animalId/history')
  async getAnimalHistory(
    @CurrentUser() user: User,
    @Param('animalId') animalId: string,
  ) {
    return this.animalsService.getAnimalHistory(user.id, animalId);
  }
}
