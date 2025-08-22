import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { TimeSlot } from './entities/time-slot.entity';
import { GetSlotsDto } from './dto/get-slots.dto';
import { Appointment } from '../appointments/entities/appointment.entity';
import { AgendaBlock } from '../agenda/entities/agenda-block.entity';

export interface AvailableSlot {
  id: string;
  startsAt: string;
  endsAt: string;
  durationMinutes: number;
  vetUserId?: string;
}

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(AgendaBlock)
    private readonly blockRepository: Repository<AgendaBlock>,
  ) {}

  async getAvailableSlots(query: GetSlotsDto): Promise<AvailableSlot[]> {
    const { clinicId, date, vetUserId } = query;

    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // Fetch available time slots
    const where: Partial<
      Pick<TimeSlot, 'clinicId' | 'isAvailable' | 'vetUserId'>
    > = {
      clinicId,
      isAvailable: true,
    };
    if (vetUserId) where.vetUserId = vetUserId;
    const slots = await this.timeSlotRepository.find({ where });

    // Exclude slots that overlap existing appointments (not cancelled)
    const appts = await this.appointmentRepository.find({
      where: { clinicId },
    });

    // Exclude slots that overlap blocks for this clinic and day (and vet if provided)
    const blocks = await this.blockRepository.find({
      where: {
        clinicId,
        ...(vetUserId ? { vetUserId } : {}),
        blockStartsAt: LessThan(endDate),
        blockEndsAt: MoreThan(startDate),
      },
    });

    const available = slots.filter((s) => {
      const sStart = new Date(s.startsAt).getTime();
      const sEnd = new Date(s.endsAt).getTime();

      const overlapsAppt = appts.some((a: Appointment) => {
        if (a.status === 'CANCELLED') return false;
        if (vetUserId && a.vetUserId !== vetUserId) return false;
        const aStart = a.startsAt.getTime();
        const aEnd = a.endsAt.getTime();
        return sStart < aEnd && aStart < sEnd;
      });

      const overlapsBlock = blocks.some((b) => {
        // When vetUserId isn't specified in the query, match block with the slot's vet
        if (
          !vetUserId &&
          b.vetUserId &&
          s.vetUserId &&
          b.vetUserId !== s.vetUserId
        )
          return false;
        const bStart = b.blockStartsAt.getTime();
        const bEnd = b.blockEndsAt.getTime();
        return sStart < bEnd && bStart < sEnd;
      });

      const inDay = s.startsAt >= startDate && s.startsAt <= endDate;
      return inDay && !overlapsAppt && !overlapsBlock;
    });

    return available
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
      .map((s) => ({
        id: s.id,
        startsAt: s.startsAt.toISOString(),
        endsAt: s.endsAt.toISOString(),
        durationMinutes: s.durationMinutes,
        vetUserId: s.vetUserId,
      }));
  }

  // NOTE: Cette méthode est UNIQUEMENT pour les tests E2E
  // Elle ne doit PAS être exposée via un endpoint public
  async seedDemoSlots(clinicId: string, vetId: string): Promise<void> {
    // Seed simple grid of slots for demo clinic and vets
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = 0; d < 3; d++) {
      const day = new Date(today.getTime() + d * 24 * 60 * 60 * 1000);
      for (let hour = 9; hour < 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startsAt = new Date(day);
          startsAt.setHours(hour, minute, 0, 0);
          const endsAt = new Date(startsAt.getTime() + 30 * 60000);
          const existing = await this.timeSlotRepository.findOne({
            where: { clinicId, vetUserId: vetId, startsAt },
          });
          if (!existing) {
            await this.timeSlotRepository.save(
              this.timeSlotRepository.create({
                clinicId,
                vetUserId: vetId,
                startsAt,
                endsAt,
                isAvailable: true,
                durationMinutes: 30,
              }),
            );
          }
        }
      }
    }
  }
}
