import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Clinic } from './entities/clinic.entity';
import { NotFoundException } from '@nestjs/common';
import { User } from '../users/entities/user.entity';
import { UserClinicRole } from '../users/entities/user-clinic-role.entity';
import { Service as ClinicServiceEntity } from './entities/service.entity';
import { CreateClinicDto } from './dto/create-clinic.dto';
import { AssignRoleDto } from './dto/assign-role.dto';

export interface Vet {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty?: string;
}

@Injectable()
export class ClinicsService {
  constructor(
    @InjectRepository(Clinic)
    private readonly clinicRepository: Repository<Clinic>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserClinicRole)
    private readonly ucrRepository: Repository<UserClinicRole>,
    @InjectRepository(ClinicServiceEntity)
    private readonly serviceRepository: Repository<ClinicServiceEntity>,
  ) {}

  async create(createClinicDto: CreateClinicDto): Promise<Clinic> {
    const clinic = this.clinicRepository.create({
      ...createClinicDto,
      active: true, // Clinics are active by default
    });
    return this.clinicRepository.save(clinic);
  }

  async update(
    id: string,
    updateClinicDto: Partial<CreateClinicDto>,
  ): Promise<Clinic> {
    const clinic = await this.clinicRepository.preload({
      id,
      ...updateClinicDto,
    });
    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }
    return this.clinicRepository.save(clinic);
  }

  async remove(id: string): Promise<void> {
    const result = await this.clinicRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Clinic with ID ${id} not found`);
    }
  }

  async assignRole(
    clinicId: string,
    assignRoleDto: AssignRoleDto,
  ): Promise<UserClinicRole> {
    const { userId, role } = assignRoleDto;

    // Verify clinic and user exist
    const clinic = await this.clinicRepository.findOne({
      where: { id: clinicId },
    });
    if (!clinic) throw new NotFoundException('Clinic not found');

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Check if assignment already exists
    const existingAssignment = await this.ucrRepository.findOne({
      where: { clinicId, userId },
    });
    if (existingAssignment) {
      // Update role if it exists
      existingAssignment.role = role;
      return this.ucrRepository.save(existingAssignment);
    }

    // Create new assignment
    const newAssignment = this.ucrRepository.create({ clinicId, userId, role });
    return this.ucrRepository.save(newAssignment);
  }

  async getClinicRoles(clinicId: string): Promise<UserClinicRole[]> {
    return this.ucrRepository.find({
      where: { clinicId },
      relations: ['user'],
    });
  }

  async searchByPostcode(
    postcode: string,
    serviceSlugs?: string[],
  ): Promise<Clinic[]> {
    if (!postcode && !serviceSlugs?.length) return [];

    const where: Partial<Record<keyof Clinic, unknown>> = {};
    if (postcode) where.postcode = ILike(`${postcode}%`);

    // Base query
    let clinics = await this.clinicRepository.find({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      where: where as any,
      order: { city: 'ASC', name: 'ASC' },
      take: 50,
    });

    if (serviceSlugs && serviceSlugs.length > 0) {
      const services = await this.serviceRepository.find({
        where: { slug: In(serviceSlugs) },
      });
      if (services.length === 0) return [];
      const serviceIds = new Set(services.map((s) => s.id));
      // OR logic: clinic has at least one of the services
      const clinicIdsWithServices = new Set<string>();
      // Load clinics with relations in batches (simple approach)
      const withRelations = await this.clinicRepository.find({
        relations: ['services'],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        where: where as any,
      });
      for (const c of withRelations) {
        if (c.services?.some((srv) => serviceIds.has(srv.id))) {
          clinicIdsWithServices.add(c.id);
        }
      }
      clinics = clinics.filter((c) => clinicIdsWithServices.has(c.id));
    }

    return clinics;
  }

  async findAll(): Promise<Clinic[]> {
    return this.clinicRepository.find({
      order: { city: 'ASC', name: 'ASC' },
    });
  }

  async getAllClinics(): Promise<Clinic[]> {
    return this.clinicRepository.find({
      order: { city: 'ASC', name: 'ASC' },
      take: 25,
    });
  }

  async getById(id: string): Promise<Clinic | null> {
    return this.clinicRepository.findOne({
      where: { id },
      relations: ['services'],
    });
  }

  async seedDemoData(): Promise<void> {
    const demoClinics = [
      {
        name: 'Clinique Vétérinaire du Marais',
        city: 'Paris',
        postcode: '75003',
        addressLine1: '12 Rue des Filles du Calvaire',
        country: 'France',
        phone: '+33 1 23 45 67 89',
        email: 'marais@vitavet.fr',
        website: 'https://marais.vitavet.fr',
        latitude: 48.8636,
        longitude: 2.3645,
        openingHours: {
          mon: '09:00-19:00',
          tue: '09:00-19:00',
          wed: '09:00-19:00',
          thu: '09:00-19:00',
          fri: '09:00-19:00',
          sat: '10:00-16:00',
          sun: null,
        },
      },
      {
        name: 'Centre Vétérinaire Saint-Germain',
        city: 'Paris',
        postcode: '75006',
        addressLine1: '5 Boulevard Saint-Germain',
        country: 'France',
        phone: '+33 1 98 76 54 32',
        email: 'saintgermain@vitavet.fr',
        website: 'https://stgermain.vitavet.fr',
        latitude: 48.853,
        longitude: 2.34,
        openingHours: {
          mon: '08:30-18:30',
          tue: '08:30-18:30',
          wed: '08:30-18:30',
          thu: '08:30-18:30',
          fri: '08:30-18:30',
          sat: null,
          sun: null,
        },
      },
      {
        name: 'Clinique Animale de la Bastille',
        city: 'Paris',
        postcode: '75011',
      },
      {
        name: 'Vétérinaire Montmartre',
        city: 'Paris',
        postcode: '75018',
      },
      {
        name: 'Clinique des Animaux de Lyon',
        city: 'Lyon',
        postcode: '69001',
      },
      {
        name: 'Centre Vétérinaire Part-Dieu',
        city: 'Lyon',
        postcode: '69003',
      },
      {
        name: 'Clinique Vétérinaire de la Croix-Rousse',
        city: 'Lyon',
        postcode: '69004',
      },
      {
        name: 'Vétérinaire Confluence',
        city: 'Lyon',
        postcode: '69002',
      },
      {
        name: 'Clinique Animale de Marseille',
        city: 'Marseille',
        postcode: '13001',
      },
      {
        name: 'Centre Vétérinaire du Vieux-Port',
        city: 'Marseille',
        postcode: '13002',
      },
      {
        name: 'Clinique Vétérinaire de la Canebière',
        city: 'Marseille',
        postcode: '13006',
      },
      {
        name: 'Vétérinaire Prado',
        city: 'Marseille',
        postcode: '13008',
      },
    ];

    for (const clinicData of demoClinics) {
      const existing = await this.clinicRepository.findOne({
        where: { name: clinicData.name, postcode: clinicData.postcode },
      });
      if (!existing) {
        const clinic = this.clinicRepository.create({
          ...clinicData,
          active: true,
        });
        await this.clinicRepository.save(clinic);
      }
    }

    // Seed services and attach to clinics
    const defaultServices = [
      { slug: 'consultation', label: 'Consultations' },
      { slug: 'urgence', label: 'Urgences' },
      { slug: 'imagerie', label: 'Imagerie' },
      { slug: 'chirurgie', label: 'Chirurgie' },
      { slug: 'nac', label: 'NAC' },
      { slug: 'hospitalisation', label: 'Hospitalisation' },
      { slug: 'dentisterie', label: 'Dentisterie' },
      { slug: 'dermatologie', label: 'Dermatologie' },
    ];
    const serviceEntities: Record<string, ClinicServiceEntity> = {};
    for (const s of defaultServices) {
      let ent = await this.serviceRepository.findOne({
        where: { slug: s.slug },
      });
      if (!ent)
        ent = await this.serviceRepository.save(
          this.serviceRepository.create(s),
        );
      serviceEntities[s.slug] = ent;
    }

    const allClinics = await this.clinicRepository.find({
      relations: ['services'],
    });
    for (const c of allClinics) {
      const assigns = ['consultation'];
      if (c.city === 'Paris') assigns.push('urgence', 'imagerie');
      if (c.city === 'Lyon') assigns.push('chirurgie');
      if (!c.services) c.services = [];
      for (const slug of assigns) {
        const s = serviceEntities[slug];
        if (s && !c.services.find((x) => x.id === s.id)) {
          c.services.push(s);
        }
      }
      await this.clinicRepository.save(c);
    }
  }

  async listServices(): Promise<ClinicServiceEntity[]> {
    return this.serviceRepository.find({ order: { label: 'ASC' } });
  }

  async getVetsByClinic(clinicId: string): Promise<Vet[]> {
    const clinic = await this.clinicRepository.findOne({
      where: { id: clinicId },
    });
    if (!clinic)
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);

    const links = await this.ucrRepository.find({
      where: { clinicId, role: 'VET' },
    });
    const vetIds = links.map((l) => l.userId);
    if (vetIds.length === 0) return [];

    const vets = await this.userRepository.find({
      where: { id: In(vetIds) },
    });
    return vets.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
    }));
  }
}
