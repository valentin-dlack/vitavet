import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, MoreThan } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { User } from '../users/entities/user.entity';
import { Animal } from '../animals/entities/animal.entity';
import { TimeSlot } from '../slots/entities/time-slot.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';
import { RemindersService } from '../reminders/reminders.service';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { RejectAppointmentDto } from './dto/reject-appointment.dto';
import { Document } from '../documents/entities/document.entity';

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
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(TimeSlot)
    private readonly timeSlotRepository: Repository<TimeSlot>,
    @InjectRepository(UserClinicRole)
    private readonly ucrRepository: Repository<UserClinicRole>,
    private readonly remindersService: RemindersService,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
  ) {}

  async createAppointment(
    createDto: CreateAppointmentDto,
    createdByUserId: string,
  ): Promise<AppointmentResponse> {
    const { clinicId, animalId, vetUserId, startsAt } = createDto;

    // Animal and clinic checks
    const animal = await this.animalRepository.findOne({
      where: { id: animalId },
    });
    if (!animal) throw new NotFoundException('Animal not found');
    if (animal.clinicId !== clinicId)
      throw new ForbiddenException('Animal not in clinic');

    // If creator is OWNER in clinic, must own the animal
    const creatorLinks = await this.ucrRepository.find({
      where: { userId: createdByUserId, clinicId },
    });
    const isOwner = creatorLinks.some((l) => l.role === 'OWNER');
    if (isOwner && animal.ownerId !== createdByUserId) {
      throw new ForbiddenException('You can only book for your own animals');
    }

    // Vet must be in clinic
    const vetLink = await this.ucrRepository.findOne({
      where: { userId: vetUserId, clinicId, role: 'VET' },
    });
    if (!vetLink) throw new BadRequestException('Vet is not in this clinic');

    const startDate = new Date(startsAt);
    const slot = await this.timeSlotRepository.findOne({
      where: { clinicId, vetUserId, startsAt: startDate, isAvailable: true },
    });
    if (!slot) throw new BadRequestException('Selected slot is not available');

    const endsAt = new Date(
      startDate.getTime() + (slot.durationMinutes || 30) * 60000,
    );

    const conflict = await this.appointmentRepository.findOne({
      where: { vetUserId, startsAt: startDate },
    });
    if (conflict) throw new ConflictException('Slot is already booked');

    const toSave = this.appointmentRepository.create({
      ...createDto,
      startsAt: startDate,
      endsAt,
      status: 'PENDING' as AppointmentStatus,
      createdByUserId,
    });

    const saved = await this.appointmentRepository.save(toSave);
    slot.isAvailable = false;
    await this.timeSlotRepository.save(slot);

    // Plan reminders (fire-and-forget)
    try {
      await this.remindersService.planAppointmentReminders(saved.id);
    } catch {
      // ignore reminder planning failures in MVP
    }

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
    limit: number = 20,
    offset: number = 0,
  ): Promise<{ appointments: AppointmentResponse[]; total: number }> {
    const where: FindOptionsWhere<Appointment> = { status: 'PENDING' };
    if (clinicId) where.clinicId = clinicId;

    // Get total count for pagination
    const total = await this.appointmentRepository.count({ where });

    // Get paginated appointments
    const appointments = await this.appointmentRepository.find({
      where,
      order: { startsAt: 'ASC' },
      skip: offset,
      take: limit,
    });

    // Batch load details
    const vetIds = Array.from(new Set(appointments.map((a) => a.vetUserId)));
    const animalIds = Array.from(new Set(appointments.map((a) => a.animalId)));

    const [vets, animals] = await Promise.all([
      vetIds.length
        ? this.userRepository.find({ where: { id: In(vetIds) } })
        : Promise.resolve([]),
      animalIds.length
        ? this.animalRepository.find({ where: { id: In(animalIds) } })
        : Promise.resolve([]),
    ]);

    const ownerIds = Array.from(new Set(animals.map((an) => an.ownerId)));
    const owners = ownerIds.length
      ? await this.userRepository.find({ where: { id: In(ownerIds) } })
      : [];

    const appointmentResponses = appointments.map((apt) => {
      const animal = animals.find((a) => a.id === apt.animalId);
      const vet = vets.find((u) => u.id === apt.vetUserId);
      const owner = animal
        ? owners.find((u) => u.id === animal.ownerId)
        : undefined;
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
          ? {
              id: vet.id,
              firstName: vet.firstName,
              lastName: vet.lastName,
              email: vet.email,
            }
          : undefined,
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
      };
    });

    return {
      appointments: appointmentResponses,
      total,
    };
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

  async completeAppointment(
    id: string,
    vetUserId: string,
    completeDto: CompleteAppointmentDto,
  ): Promise<AppointmentResponse> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.vetUserId !== vetUserId) {
      throw new ForbiddenException(
        'You can only complete your own appointments',
      );
    }

    if (appointment.status === 'COMPLETED') {
      throw new ConflictException('Appointment is already completed');
    }

    appointment.notes = completeDto.notes ?? appointment.notes;
    appointment.report = completeDto.report ?? appointment.report;
    appointment.status = 'COMPLETED';

    const saved = await this.appointmentRepository.save(appointment);

    return {
      id: saved.id,
      clinicId: saved.clinicId,
      animalId: saved.animalId,
      vetUserId: saved.vetUserId,
      typeId: saved.typeId ?? undefined,
      status: saved.status,
      startsAt: saved.startsAt.toISOString(),
      endsAt: saved.endsAt.toISOString(),
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async rejectAppointment(
    id: string,
    rejectDto: RejectAppointmentDto,
  ): Promise<AppointmentResponse> {
    const appointment = await this.appointmentRepository.findOne({
      where: { id },
      relations: { animal: true, vet: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === 'REJECTED') {
      throw new ConflictException('Appointment is already rejected');
    }

    if (appointment.status === 'COMPLETED') {
      throw new ConflictException('Cannot reject a completed appointment');
    }

    appointment.status = 'REJECTED';
    appointment.rejectionReason = rejectDto.rejectionReason;

    const saved = await this.appointmentRepository.save(appointment);

    // Log the rejection for audit purposes
    console.log(
      `Appointment ${id} rejected by vet ${appointment.vetUserId} with reason: ${rejectDto.rejectionReason}`,
    );

    return {
      id: saved.id,
      clinicId: saved.clinicId,
      animalId: saved.animalId,
      vetUserId: saved.vetUserId,
      typeId: saved.typeId ?? undefined,
      status: saved.status,
      startsAt: saved.startsAt.toISOString(),
      endsAt: saved.endsAt.toISOString(),
      createdAt: saved.createdAt.toISOString(),
    };
  }

  async getOwnerUpcomingAppointments(
    ownerId: string,
  ): Promise<AppointmentResponse[]> {
    // find animals of owner
    const animals = await this.animalRepository.find({ where: { ownerId } });
    if (animals.length === 0) return [];
    const animalIds = animals.map((a) => a.id);
    const now = new Date();
    const filtered = await this.appointmentRepository.find({
      where: {
        animalId: In(animalIds),
        startsAt: MoreThan(now),
      },
      order: { startsAt: 'ASC' },
    });

    // enrich minimal animal and vet details
    const vetIds = Array.from(new Set(filtered.map((a) => a.vetUserId)));
    const [vets] = await Promise.all([
      vetIds.length
        ? this.userRepository.find({ where: { id: In(vetIds) } })
        : Promise.resolve([]),
    ]);

    const responses: AppointmentResponse[] = filtered.map((apt) => {
      const vet = vets.find((v) => v.id === apt.vetUserId);
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
          ? {
              id: vet.id,
              firstName: vet.firstName,
              lastName: vet.lastName,
              email: vet.email,
            }
          : undefined,
      };
    });

    return responses;
  }

  async getOwnerAppointments(
    ownerId: string,
    status?: AppointmentStatus,
  ): Promise<AppointmentResponse[]> {
    const animals = await this.animalRepository.find({ where: { ownerId } });
    if (animals.length === 0) return [];
    const animalIds = animals.map((a) => a.id);

    const where: FindOptionsWhere<Appointment> = {
      animalId: In(animalIds),
    } as FindOptionsWhere<Appointment>;
    if (status) {
      (where as unknown as { status?: AppointmentStatus }).status = status;
    }
    const list = await this.appointmentRepository.find({
      where,
      order: { startsAt: 'DESC' },
    });

    const vetIds = Array.from(new Set(list.map((a) => a.vetUserId)));
    const [vets] = await Promise.all([
      vetIds.length
        ? this.userRepository.find({ where: { id: In(vetIds) } })
        : Promise.resolve([]),
    ]);

    return list.map((apt) => {
      const vet = vets.find((v) => v.id === apt.vetUserId);
      return {
        id: apt.id,
        clinicId: apt.clinicId,
        animalId: apt.animalId,
        vetUserId: apt.vetUserId,
        typeId: apt.typeId ?? undefined,
        status: apt.status,
        startsAt: apt.startsAt.toISOString(),
        endsAt: apt.endsAt.toISOString(),
        createdAt: apt.createdAt.toISOString(),
        vet: vet
          ? {
              id: vet.id,
              firstName: vet.firstName,
              lastName: vet.lastName,
              email: vet.email,
            }
          : undefined,
      };
    });
  }

  async findDocumentsByAppointmentId(
    appointmentId: string,
  ): Promise<Document[]> {
    return this.documentRepo.find({
      where: { appointmentId },
      order: { createdAt: 'DESC' },
    });
  }
}
