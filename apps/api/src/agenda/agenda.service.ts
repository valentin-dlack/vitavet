import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, LessThan, MoreThan, Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Animal } from '../animals/entities/animal.entity';
import { User } from '../users/entities/user.entity';
import { AgendaBlock } from './entities/agenda-block.entity';
import { TimeSlot } from '../slots/entities/time-slot.entity';

export interface AgendaItem {
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'BLOCKED';
  reason?: string | null;
  animal?: {
    id: string;
    name: string;
    birthdate?: string | null;
    species?: string | null;
    breed?: string | null;
    weightKg?: number | null;
  };
  owner?: { id: string; firstName: string; lastName: string; email: string };
}

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(AgendaBlock)
    private readonly blockRepository: Repository<AgendaBlock>,
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
  ) {}

  async getVetDayAgenda(vetUserId: string, date: Date): Promise<AgendaItem[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const appts = await this.appointmentRepository.find({
      where: { vetUserId, startsAt: Between(start, end) },
      order: { startsAt: 'ASC' },
    });
    const blocks = await this.blockRepository.find({
      where: {
        vetUserId,
        blockStartsAt: LessThan(end),
        blockEndsAt: MoreThan(start),
      },
    });

    const animalIds = Array.from(new Set(appts.map((a) => a.animalId)));
    const animals = animalIds.length
      ? await this.animalRepository.find({
          where: { id: In(animalIds) },
        })
      : [];

    const ownerIds = Array.from(new Set(animals.map((a) => a.ownerId)));
    const owners = ownerIds.length
      ? await this.userRepository.find({
          where: { id: In(ownerIds) },
        })
      : [];

    const items = appts.map((a) => {
      const animal = animals.find((an) => an.id === a.animalId);
      const owner = animal
        ? owners.find((u) => u.id === animal.ownerId)
        : undefined;
      return {
        id: a.id,
        startsAt: a.startsAt.toISOString(),
        endsAt: a.endsAt.toISOString(),
        status: a.status,
        animal: animal
          ? {
              id: animal.id,
              name: animal.name,
              birthdate: animal.birthdate ?? null,
              species: animal.species ?? null,
              breed: animal.breed ?? null,
              weightKg: animal.weightKg ?? null,
            }
          : undefined,
        owner: owner
          ? {
              id: owner.id,
              firstName: owner.firstName,
              lastName: owner.lastName,
              email: owner.email,
            }
          : undefined,
      } as AgendaItem;
    });
    const blockItems: AgendaItem[] = blocks.map((b) => ({
      id: b.id,
      startsAt: b.blockStartsAt.toISOString(),
      endsAt: b.blockEndsAt.toISOString(),
      status: 'BLOCKED',
      reason: b.reason ?? null,
    }));
    return [...items, ...blockItems].sort((a, b) =>
      a.startsAt.localeCompare(b.startsAt),
    );
  }

  async getVetRangeAgenda(
    vetUserId: string,
    start: Date,
    end: Date,
  ): Promise<AgendaItem[]> {
    const appts = await this.appointmentRepository.find({
      where: { vetUserId, startsAt: Between(start, end) },
      order: { startsAt: 'ASC' },
    });
    const blocks = await this.blockRepository.find({
      where: {
        vetUserId,
        blockStartsAt: LessThan(end),
        blockEndsAt: MoreThan(start),
      },
    });

    const animalIds = Array.from(new Set(appts.map((a) => a.animalId)));
    const animals = animalIds.length
      ? await this.animalRepository.find({
          where: { id: In(animalIds) },
        })
      : [];

    const ownerIds = Array.from(new Set(animals.map((a) => a.ownerId)));
    const owners = ownerIds.length
      ? await this.userRepository.find({
          where: { id: In(ownerIds) },
        })
      : [];

    const items = appts.map((a) => {
      const animal = animals.find((an) => an.id === a.animalId);
      const owner = animal
        ? owners.find((u) => u.id === animal.ownerId)
        : undefined;
      return {
        id: a.id,
        startsAt: a.startsAt.toISOString(),
        endsAt: a.endsAt.toISOString(),
        status: a.status,
        animal: animal
          ? {
              id: animal.id,
              name: animal.name,
              birthdate: animal.birthdate ?? null,
              species: animal.species ?? null,
              breed: animal.breed ?? null,
              weightKg: animal.weightKg ?? null,
            }
          : undefined,
        owner: owner
          ? {
              id: owner.id,
              firstName: owner.firstName,
              lastName: owner.lastName,
              email: owner.email,
            }
          : undefined,
      } as AgendaItem;
    });
    const blockItems: AgendaItem[] = blocks.map((b) => ({
      id: b.id,
      startsAt: b.blockStartsAt.toISOString(),
      endsAt: b.blockEndsAt.toISOString(),
      status: 'BLOCKED',
      reason: b.reason ?? null,
    }));
    return [...items, ...blockItems].sort((a, b) =>
      a.startsAt.localeCompare(b.startsAt),
    );
  }

  async blockSlots(
    clinicId: string,
    vetUserId: string,
    startsAt: Date,
    endsAt: Date,
    reason?: string,
  ): Promise<
    { id: string } & Pick<
      AgendaBlock,
      'clinicId' | 'vetUserId' | 'blockStartsAt' | 'blockEndsAt' | 'reason'
    >
  > {
    if (endsAt <= startsAt) {
      throw new Error('Invalid range');
    }
    // Save block
    const block = this.blockRepository.create({
      clinicId,
      vetUserId,
      blockStartsAt: startsAt,
      blockEndsAt: endsAt,
      reason: reason ?? null,
    });
    const saved = await this.blockRepository.save(block);

    // Mark overlapping timeslots as unavailable
    const slots = await this.timeSlotRepository.find({
      where: { clinicId, vetUserId, isAvailable: true },
    });
    const overlapping = slots.filter(
      (s) => s.startsAt < endsAt && s.endsAt > startsAt,
    );
    for (const s of overlapping) {
      s.isAvailable = false;
      await this.timeSlotRepository.save(s);
    }

    return {
      id: saved.id,
      clinicId: saved.clinicId,
      vetUserId: saved.vetUserId,
      blockStartsAt: saved.blockStartsAt,
      blockEndsAt: saved.blockEndsAt,
      reason: saved.reason ?? null,
    };
  }
}
