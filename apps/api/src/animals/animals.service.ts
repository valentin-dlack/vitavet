import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Animal } from './entities/animal.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';

@Injectable()
export class AnimalsService {
  constructor(
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    @InjectRepository(UserClinicRole)
    private readonly userClinicRoleRepository: Repository<UserClinicRole>,
  ) {}

  async findByOwnerAndClinic(
    ownerId: string,
    clinicId: string,
  ): Promise<Animal[]> {
    return this.animalRepository.find({ where: { ownerId, clinicId } });
  }

  async getAnimalHistory(
    requesterId: string,
    animalId: string,
  ): Promise<{ animal: Animal; appointments: Appointment[] }> {
    const animal = await this.animalRepository.findOne({ where: { id: animalId } });
    if (!animal) throw new NotFoundException('Animal not found');

    // Authorization: owner of animal OR clinic staff (VET/ASV/ADMIN_CLINIC) of same clinic
    if (animal.ownerId !== requesterId) {
      const staffLink = await this.userClinicRoleRepository.findOne({ where: { userId: requesterId, clinicId: animal.clinicId } });
      if (!staffLink || !['VET', 'ASV', 'ADMIN_CLINIC'].includes(staffLink.role)) {
        throw new ForbiddenException('Not allowed');
      }
    }

    const appointments = await this.appointmentRepository.find({
      where: { animalId: animal.id },
      order: { startsAt: 'DESC' },
      relations: { vet: true, type: true, clinic: true },
    });

    return { animal, appointments };
  }
}
