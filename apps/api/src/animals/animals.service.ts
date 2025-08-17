import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Animal } from './entities/animal.entity';

@Injectable()
export class AnimalsService {
  constructor(
    @InjectRepository(Animal)
    private readonly animalRepository: Repository<Animal>,
  ) {}

  async findByOwnerAndClinic(
    ownerId: string,
    clinicId: string,
  ): Promise<Animal[]> {
    return this.animalRepository.find({ where: { ownerId, clinicId } });
  }
}
