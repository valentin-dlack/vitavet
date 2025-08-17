import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgendaService } from './agenda.service';
import { AgendaController } from './agenda.controller';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Animal } from '../animals/entities/animal.entity';
import { User } from '../users/entities/user.entity';
import { AgendaBlock } from './entities/agenda-block.entity';
import { TimeSlot } from '../slots/entities/time-slot.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Animal,
      User,
      AgendaBlock,
      TimeSlot,
    ]),
  ],
  providers: [AgendaService],
  controllers: [AgendaController],
})
export class AgendaModule {}
