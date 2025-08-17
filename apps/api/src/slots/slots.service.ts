import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimeSlot } from './entities/time-slot.entity';
import { GetSlotsDto } from './dto/get-slots.dto';
import { Appointment } from '../appointments/entities/appointment.entity';

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

    const available = slots.filter((s) => {
      const overlaps = appts.some((a: Appointment) => {
        if (a.status === 'CANCELLED') return false;
        if (vetUserId && a.vetUserId !== vetUserId) return false;
        const sStart = new Date(s.startsAt).getTime();
        const sEnd = new Date(s.endsAt).getTime();
        const aStart = a.startsAt.getTime();
        const aEnd = a.endsAt.getTime();
        return sStart < aEnd && aStart < sEnd;
      });
      const inDay = s.startsAt >= startDate && s.startsAt <= endDate;
      return inDay && !overlaps;
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

  private generateMockSlots(
    clinicId: string,
    date: Date,
    vetUserId?: string,
  ): AvailableSlot[] {
    const slots: AvailableSlot[] = [];

    // Mock vets for the clinic
    const mockVets = [
      '550e8400-e29b-41d4-a716-446655440001', // Dr. Martin
      '550e8400-e29b-41d4-a716-446655440002', // Dr. Dubois
      '550e8400-e29b-41d4-a716-446655440003', // Dr. Leroy
    ];

    // Generate slots from 9:00 to 17:00 (8 hours)
    const startHour = 9;
    const endHour = 17;
    const slotDuration = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, minute, 0, 0);

        const endDate = new Date(slotDate);
        endDate.setMinutes(endDate.getMinutes() + slotDuration);

        // If vetUserId is specified, only generate slots for that vet
        // Otherwise, generate slots for all vets
        const vetsToUse = vetUserId ? [vetUserId] : mockVets;

        for (const vet of vetsToUse) {
          // Skip some slots randomly to simulate availability
          if (Math.random() > 0.3) {
            // 70% availability
            slots.push({
              id: `slot-${Date.now()}-${Math.random()}`,
              startsAt: slotDate.toISOString(),
              endsAt: endDate.toISOString(),
              durationMinutes: slotDuration,
              vetUserId: vet,
            });
          }
        }
      }
    }

    // Sort by start time
    return slots.sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  }

  async seedDemoSlots(): Promise<void> {
    // Seed simple grid of slots for demo clinic and vets
    const clinicId = '550e8400-e29b-41d4-a716-446655440000';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const vets = [
      '550e8400-e29b-41d4-a716-446655440001',
      '550e8400-e29b-41d4-a716-446655440002',
    ];
    for (let d = 0; d < 3; d++) {
      const day = new Date(today.getTime() + d * 24 * 60 * 60 * 1000);
      for (const vet of vets) {
        for (let hour = 9; hour < 17; hour++) {
          for (let minute = 0; minute < 60; minute += 30) {
            const startsAt = new Date(day);
            startsAt.setHours(hour, minute, 0, 0);
            const endsAt = new Date(startsAt.getTime() + 30 * 60000);
            const existing = await this.timeSlotRepository.findOne({
              where: { clinicId, vetUserId: vet, startsAt },
            });
            if (!existing) {
              await this.timeSlotRepository.save(
                this.timeSlotRepository.create({
                  clinicId,
                  vetUserId: vet,
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
}
