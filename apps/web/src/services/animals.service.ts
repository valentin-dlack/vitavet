export interface AnimalDto {
  id: string;
  clinicId: string;
  ownerId: string;
  name: string;
  birthdate?: string | null;
}

import { httpService } from './http.service';

class AnimalsService {
  async getMyAnimals(clinicId: string): Promise<AnimalDto[]> {
    return httpService.get<AnimalDto[]>(`/animals/me?clinicId=${encodeURIComponent(clinicId)}`);
  }
}

export const animalsService = new AnimalsService();


