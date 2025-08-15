import { Controller, Get, Query, Post } from '@nestjs/common';
import { SlotsService, AvailableSlot } from './slots.service';
import { GetSlotsDto } from './dto/get-slots.dto';

@Controller('slots')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get()
  async getAvailableSlots(
    @Query() query: GetSlotsDto,
  ): Promise<AvailableSlot[]> {
    return this.slotsService.getAvailableSlots(query);
  }

  @Post('seed')
  async seedDemoSlots() {
    await this.slotsService.seedDemoSlots();
    return { message: 'Demo slots seeded successfully' };
  }
}
