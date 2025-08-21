import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Animal } from './entities/animal.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { Clinic } from '../clinics/entities/clinic.entity';

@Injectable()
export class AnimalsService {
  constructor(
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(UserClinicRole)
    private readonly userClinicRoleRepository: Repository<UserClinicRole>,
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
  ) {}

  async createAnimal(
    createDto: CreateAnimalDto,
    ownerId: string,
  ): Promise<Animal> {
    // Verify clinic exists
    const clinic = await this.clinicRepository.findOne({
      where: { id: createDto.clinicId },
    });
    if (!clinic) {
      throw new NotFoundException('Clinic not found');
    }

    // Verify user has OWNER role in this clinic
    const userRole = await this.userClinicRoleRepository.findOne({
      where: { userId: ownerId, clinicId: createDto.clinicId, role: 'OWNER' },
    });
    if (!userRole) {
      throw new ForbiddenException(
        'You must be an owner in this clinic to add animals',
      );
    }

    // Create the animal
    const animal = this.animalRepository.create({
      ...createDto,
      ownerId,
    });

    return this.animalRepository.save(animal);
  }

  async findByOwnerAndClinic(
    ownerId: string,
    clinicId?: string,
  ): Promise<Animal[]> {
    if (clinicId && clinicId.length > 0) {
      return this.animalRepository.find({ where: { ownerId, clinicId } });
    }
    return this.animalRepository.find({ where: { ownerId } });
  }

  async getAnimalHistory(
    requesterId: string,
    animalId: string,
  ): Promise<{ animal: Animal; appointments: Appointment[] }> {
    const animal = await this.animalRepository.findOne({
      where: { id: animalId },
    });
    if (!animal) throw new NotFoundException('Animal not found');

    // Check if requester is owner or staff
    const isOwner = animal.ownerId === requesterId;

    if (!isOwner) {
      const staffLink = await this.userClinicRoleRepository.findOne({
        where: { userId: requesterId, clinicId: animal.clinicId },
      });
      if (
        !staffLink ||
        !['VET', 'ASV', 'ADMIN_CLINIC'].includes(staffLink.role)
      ) {
        throw new ForbiddenException('Not allowed');
      }
    }

    const appointments = await this.appointmentRepository.find({
      where: { animalId: animal.id },
      order: { startsAt: 'DESC' },
      relations: { vet: true, type: true, clinic: true },
    });

    // Filter out internal notes for owners
    const filteredAppointments = appointments.map((appointment) => {
      if (isOwner) {
        // For owners, remove internal notes but keep reports
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { notes, ...appointmentWithoutNotes } = appointment;
        return appointmentWithoutNotes;
      }
      // For staff, return full appointment data
      return appointment;
    });

    return { animal, appointments: filteredAppointments };
  }
}
