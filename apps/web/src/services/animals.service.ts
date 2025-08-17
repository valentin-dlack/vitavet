export interface AnimalDto {
  id: string;
  clinicId: string;
  ownerId: string;
  name: string;
  birthdate?: string | null;
}

class AnimalsService {
  async getMyAnimals(clinicId: string): Promise<AnimalDto[]> {
    const { httpService } = await import('./http.service');
    return httpService.get<AnimalDto[]>(`/animals/me?clinicId=${encodeURIComponent(clinicId)}`);
  }
}

export const animalsService = new AnimalsService();


