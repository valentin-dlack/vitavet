import { httpService } from './http.service';

export type ClinicDto = { id: string; name: string; city: string; postcode: string };
export type ClinicDetailDto = ClinicDto & {
  addressLine1?: string | null;
  addressLine2?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  openingHours?: Record<string, string | null> | null;
  services?: { id: string; slug: string; label: string }[];
};
export type ServiceDto = { id: string; slug: string; label: string };

export interface Vet {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  specialty?: string;
}

export interface UserClinicRoleDto {
  userId: string;
  clinicId: string;
  role: string;
  user?: {
    firstName: string;
    lastName: string;
  };
}

interface CreateClinicPayload {
  name: string;
  city: string;
  postcode: string;
}

class ClinicsService {
  private baseUrl = '/clinics'; // Correction: on retire /api

  async createClinic(payload: CreateClinicPayload): Promise<ClinicDto> {
    return httpService.post<ClinicDto>(this.baseUrl, payload);
  }

  async updateClinic(id: string, payload: Partial<CreateClinicPayload>): Promise<ClinicDetailDto> {
    return httpService.patch<ClinicDetailDto>(`${this.baseUrl}/${id}`, payload);
  }

  async deleteClinic(id: string): Promise<void> {
    return httpService.delete<void>(`${this.baseUrl}/${id}`);
  }

  async assignRole(clinicId: string, userId: string, role: string): Promise<UserClinicRoleDto> {
    return httpService.post<UserClinicRoleDto>(`${this.baseUrl}/${clinicId}/roles`, { userId, role });
  }

  async getClinicRoles(clinicId: string): Promise<UserClinicRoleDto[]> {
    return httpService.get<UserClinicRoleDto[]>(`${this.baseUrl}/${clinicId}/roles`);
  }

  async search(postcode: string, serviceSlugs?: string[]): Promise<ClinicDto[]> {
    const params = new URLSearchParams();
    if (postcode) params.set('postcode', postcode);
    if (serviceSlugs && serviceSlugs.length) {
      params.set('services', serviceSlugs.join(','));
    }
    const queryString = params.toString();
    return httpService.get<ClinicDto[]>(`${this.baseUrl}${queryString ? `?${queryString}` : ''}`);
  }

  async getVetsByClinic(clinicId: string): Promise<Vet[]> {
    return httpService.get<Vet[]>(`${this.baseUrl}/${clinicId}/vets`);
  }

  async getById(id: string): Promise<ClinicDetailDto> {
    return httpService.get<ClinicDetailDto>(`${this.baseUrl}/${id}`);
  }

  async listServices(): Promise<ServiceDto[]> {
    return httpService.get<ServiceDto[]>(`${this.baseUrl}/services/list`);
  }
}

export const clinicsService = new ClinicsService();


