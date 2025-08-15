import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Clinic } from './entities/clinic.entity';

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
}
