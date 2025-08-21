export interface AnimalDto {
  id: string;
  clinicId: string;
  ownerId: string;
  name: string;
  birthdate?: string | null;
  species?: string | null;
  breed?: string | null;
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN' | null;
  isSterilized?: boolean | null;
  color?: string | null;
  chipId?: string | null;
  weightKg?: number | null;
  heightCm?: number | null;
  isNac?: boolean | null;
}

export interface CreateAnimalDto {
  name: string;
  clinicId: string;
  birthdate?: string;
  species?: string;
  breed?: string;
  sex?: 'MALE' | 'FEMALE' | 'UNKNOWN';
  isSterilized?: boolean;
  color?: string;
  chipId?: string;
  weightKg?: number;
  heightCm?: number;
  isNac?: boolean;
}

import { httpService } from './http.service';

export interface AnimalHistoryItemVetDto {
  firstName?: string;
  lastName?: string;
}

export interface AnimalHistoryItemTypeDto {
  label?: string;
}

export interface AnimalHistoryItemDto {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  notes?: string | null;
  report?: string | null;
  vet?: AnimalHistoryItemVetDto | null;
  type?: AnimalHistoryItemTypeDto | null;
}

export interface AnimalHistoryDto {
  animal: AnimalDto;
  appointments: AnimalHistoryItemDto[];
}

class AnimalsService {
  async getMyAnimals(clinicId: string): Promise<AnimalDto[]> {
    return httpService.get<AnimalDto[]>(`/animals/me?clinicId=${encodeURIComponent(clinicId)}`);
  }

  async createAnimal(animalData: CreateAnimalDto): Promise<AnimalDto> {
    return httpService.post<AnimalDto>('/animals', animalData);
  }

  async getHistory(animalId: string): Promise<AnimalHistoryDto> {
    return httpService.get<AnimalHistoryDto>(`/animals/${encodeURIComponent(animalId)}/history`);
  }
}

export const animalsService = new AnimalsService();


