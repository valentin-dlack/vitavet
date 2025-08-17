import { Controller, Get, Query } from '@nestjs/common';
import { GetSlotsDto } from './dto/get-slots.dto';
import { AvailableSlot, SlotsService } from './slots.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UseGuards } from '@nestjs/common';

@Controller('slots')
@UseGuards(ThrottlerGuard)
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  async getAvailableSlots(
    @Query() query: GetSlotsDto,
  ): Promise<AvailableSlot[]> {
    return this.slotsService.getAvailableSlots(query);
  }
}
