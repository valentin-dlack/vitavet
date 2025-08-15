import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

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
}

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
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
    const where: any = { status: 'PENDING' };
    if (clinicId) where.clinicId = clinicId;

    const appointments = await this.appointmentRepository.find({
      where,
      order: { startsAt: 'ASC' },
    });

    return appointments.map((apt) => ({
      id: apt.id,
      clinicId: apt.clinicId,
      animalId: apt.animalId ?? undefined,
      vetUserId: apt.vetUserId ?? undefined,
      typeId: apt.typeId ?? undefined,
      status: apt.status,
      startsAt: apt.startsAt.toISOString(),
      endsAt: apt.endsAt.toISOString(),
      createdAt: apt.createdAt.toISOString(),
    }));
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
