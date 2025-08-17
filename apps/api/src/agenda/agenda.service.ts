import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { Appointment } from '../appointments/entities/appointment.entity';
import { Animal } from '../animals/entities/animal.entity';
import { User } from '../users/entities/user.entity';

export interface AgendaItem {
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
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

    if (appts.length === 0) return [];

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

    return appts.map((a) => {
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
  }
}
