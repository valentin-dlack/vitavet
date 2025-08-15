import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Clinic } from './entities/clinic.entity';
import { NotFoundException } from '@nestjs/common';

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
  ) {}

  async searchByPostcode(postcode: string): Promise<Clinic[]> {
    if (!postcode) return [];
    // Fast LIKE( prefix ) on indexed column
    return this.clinicRepository.find({
      where: { postcode: ILike(`${postcode}%`) },
      order: { city: 'ASC', name: 'ASC' },
      take: 25,
    });
  }

  async getAllClinics(): Promise<Clinic[]> {
    return this.clinicRepository.find({
      order: { city: 'ASC', name: 'ASC' },
      take: 25,
    });
  }

  async seedDemoData(): Promise<void> {
    const demoClinics = [
      {
        name: 'Clinique Vétérinaire du Marais',
        city: 'Paris',
        postcode: '75003',
      },
      {
        name: 'Centre Vétérinaire Saint-Germain',
        city: 'Paris',
        postcode: '75006',
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
  }

  async getVetsByClinic(clinicId: string): Promise<Vet[]> {
    // Vérifier que la clinique existe
    const clinic = await this.clinicRepository.findOne({
      where: { id: clinicId },
    });

    if (!clinic) {
      throw new NotFoundException(`Clinic with ID ${clinicId} not found`);
    }

    // Données fictives de vétérinaires pour la démo
    const mockVets: Vet[] = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        firstName: 'Dr. Martin',
        lastName: 'Dubois',
        email: 'martin.dubois@vitavet.fr',
        specialty: 'Chirurgie générale',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        firstName: 'Dr. Sophie',
        lastName: 'Leroy',
        email: 'sophie.leroy@vitavet.fr',
        specialty: 'Dermatologie',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        firstName: 'Dr. Pierre',
        lastName: 'Moreau',
        email: 'pierre.moreau@vitavet.fr',
        specialty: 'Cardiologie',
      },
    ];

    return mockVets;
  }
}
