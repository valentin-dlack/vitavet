import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User } from '../users/entities/user.entity';
import { Animal } from '../animals/entities/animal.entity';

export interface AppointmentResponse {
  id: string;
  clinicId: string;
  animalId: string;
  vetUserId: string;
  typeId?: string;
  status: AppointmentStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  vet?: { id: string; firstName: string; lastName: string; email: string };
  animal?: { id: string; name: string; birthdate?: string | null };
  owner?: { id: string; firstName: string; lastName: string; email: string };
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
  ) {}

  async createAppointment(
    createDto: CreateAppointmentDto,
    createdByUserId: string,
  ): Promise<AppointmentResponse> {
    // Calculate end time (30 minutes by default)
    const startsAt = new Date(createDto.startsAt);
    const endsAt = new Date(startsAt.getTime() + 30 * 60 * 1000); // +30 minutes

    // Check for conflicts (simplified - in real app would check actual slots)
    const conflictingAppointment = await this.appointmentRepository.findOne({
      where: {
        vetUserId: createDto.vetUserId,
        startsAt: startsAt,
        status: 'CONFIRMED',
      },
    });

    if (conflictingAppointment) {
      throw new ConflictException('Slot is already booked');
    }

    // Create appointment
    const appointment = this.appointmentRepository.create({
      ...createDto,
      startsAt,
      endsAt,
      status: 'PENDING' as AppointmentStatus,
      createdByUserId,
    });

    const saved = await this.appointmentRepository.save(appointment);

    return {
      id: saved.id,
      clinicId: saved.clinicId,
      animalId: saved.animalId ?? undefined,
      vetUserId: saved.vetUserId ?? undefined,
      typeId: saved.typeId ?? undefined,
      status: saved.status,
      startsAt: saved.startsAt.toISOString(),
      endsAt: saved.endsAt.toISOString(),
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async getPendingAppointments(
    clinicId?: string,
  ): Promise<AppointmentResponse[]> {
    const where: FindOptionsWhere<Appointment> = { status: 'PENDING' };
    if (clinicId) where.clinicId = clinicId;

    const appointments = await this.appointmentRepository.find({
      where,
      order: { startsAt: 'ASC' },
    });

    // Batch load details
    const vetIds = Array.from(new Set(appointments.map((a) => a.vetUserId)));
    const animalIds = Array.from(new Set(appointments.map((a) => a.animalId)));

    const [vets, animals] = await Promise.all([
      this.userRepository.find({ where: vetIds.map((id) => ({ id })) as any }),
      this.animalRepository.find({ where: animalIds.map((id) => ({ id })) as any }),
    ]);

    const ownerIds = Array.from(new Set(animals.map((an) => an.ownerId)));
    const owners = ownerIds.length
      ? await this.userRepository.find({ where: ownerIds.map((id) => ({ id })) as any })
      : [];

    return appointments.map((apt) => {
      const animal = animals.find((a) => a.id === apt.animalId);
      const vet = vets.find((u) => u.id === apt.vetUserId);
      const owner = animal ? owners.find((u) => u.id === animal.ownerId) : undefined;
      return {
        id: apt.id,
        clinicId: apt.clinicId,
        animalId: apt.animalId ?? undefined,
        vetUserId: apt.vetUserId ?? undefined,
        typeId: apt.typeId ?? undefined,
        status: apt.status,
        startsAt: apt.startsAt.toISOString(),
        endsAt: apt.endsAt.toISOString(),
        createdAt: apt.createdAt.toISOString(),
        vet: vet
          ? { id: vet.id, firstName: vet.firstName, lastName: vet.lastName, email: vet.email }
          : undefined,
        animal: animal
          ? { id: animal.id, name: animal.name, birthdate: animal.birthdate ?? null }
          : undefined,
        owner: owner
          ? { id: owner.id, firstName: owner.firstName, lastName: owner.lastName, email: owner.email }
          : undefined,
      };
    });
  }

  async confirmAppointment(id: string): Promise<AppointmentResponse> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status !== 'PENDING') {
      throw new ConflictException('Appointment is not pending');
    }

    appointment.status = 'CONFIRMED';
    const saved = await this.appointmentRepository.save(appointment);

    return {
      id: saved.id,
      clinicId: saved.clinicId,
      animalId: saved.animalId ?? undefined,
      vetUserId: saved.vetUserId ?? undefined,
      typeId: saved.typeId ?? undefined,
      status: saved.status,
      startsAt: saved.startsAt.toISOString(),
      endsAt: saved.endsAt.toISOString(),
      createdAt: saved.createdAt.toISOString(),
    };
  }
}
