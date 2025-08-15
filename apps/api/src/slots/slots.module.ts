import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';
import { TimeSlot } from './entities/time-slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimeSlot])],
  providers: [SlotsService],
  controllers: [SlotsController],
  exports: [SlotsService],
})
export class SlotsModule {}
