export interface AnimalDto {
  id: string;
  clinicId: string;
  ownerId: string;
  name: string;
  birthdate?: string | null;
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

  async getHistory(animalId: string): Promise<AnimalHistoryDto> {
    return httpService.get<AnimalHistoryDto>(`/animals/${encodeURIComponent(animalId)}/history`);
  }
}

export const animalsService = new AnimalsService();


