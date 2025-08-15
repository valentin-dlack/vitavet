import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TimeSlot } from './entities/time-slot.entity';
import { GetSlotsDto } from './dto/get-slots.dto';

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
  ) {}

  async getAvailableSlots(query: GetSlotsDto): Promise<AvailableSlot[]> {
    const { clinicId, date, vetUserId } = query;

    // Parse the date and create start/end of day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    // For MVP, generate mock slots instead of querying database
    return this.generateMockSlots(clinicId, startDate, vetUserId);
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
    // This method can be used to seed real slots in the database later
    const demoSlots = this.generateMockSlots(
      '550e8400-e29b-41d4-a716-446655440000', // demo clinic
      new Date(),
    );

    for (const slotData of demoSlots) {
      const existing = await this.timeSlotRepository.findOne({
        where: {
          clinicId: slotData.vetUserId
            ? '550e8400-e29b-41d4-a716-446655440000'
            : undefined,
          startsAt: new Date(slotData.startsAt),
          vetUserId: slotData.vetUserId,
        },
      });

      if (!existing) {
        const slot = this.timeSlotRepository.create({
          clinicId: '550e8400-e29b-41d4-a716-446655440000',
          vetUserId: slotData.vetUserId,
          startsAt: new Date(slotData.startsAt),
          endsAt: new Date(slotData.endsAt),
          isAvailable: true,
          durationMinutes: slotData.durationMinutes,
        });
        await this.timeSlotRepository.save(slot);
      }
    }
  }
}
