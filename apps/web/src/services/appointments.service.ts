export interface AppointmentResponse {
  id: string;
  clinicId: string;
  animalId?: string;
  vetUserId?: string;
  typeId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  startsAt: string;
  endsAt: string;
  createdAt: string;
  vet?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  animal?: {
    id: string;
    name: string;
    birthdate?: string | null;
    species?: string | null;
    breed?: string | null;
    weightKg?: number | null;
  };
  owner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface PendingAppointmentsResponse {
  appointments: AppointmentResponse[];
  total: number;
}

export interface CreateAppointmentData {
  clinicId: string;
  animalId: string;
  vetUserId: string;
  startsAt: string;
}

export interface CompleteAppointmentData {
  notes?: string;
  report?: string;
}

import { httpService } from './http.service';

class AppointmentsService {
  async createAppointment(data: CreateAppointmentData): Promise<AppointmentResponse> {
    return httpService.post<AppointmentResponse>('/appointments', data);
  }

  async getMyUpcoming(): Promise<AppointmentResponse[]> {
    return httpService.get<AppointmentResponse[]>('/appointments/me');
  }

  async getMyAppointments(status?: AppointmentResponse['status']): Promise<AppointmentResponse[]> {
    const url = status ? `/appointments/me?status=${encodeURIComponent(status)}` : '/appointments/me';
    return httpService.get<AppointmentResponse[]>(url);
  }

  async getPendingAppointments(
    clinicId?: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PendingAppointmentsResponse> {
    const params = new URLSearchParams();
    if (clinicId) params.set('clinicId', clinicId);
    params.set('limit', limit.toString());
    params.set('offset', offset.toString());
    
    return httpService.get<PendingAppointmentsResponse>(`/appointments/pending?${params.toString()}`);
  }

  async confirmAppointment(id: string): Promise<AppointmentResponse> {
    return httpService.patch<AppointmentResponse>(`/appointments/${id}/confirm`);
  }

  async completeAppointment(id: string, data: CompleteAppointmentData): Promise<AppointmentResponse> {
    return httpService.patch<AppointmentResponse>(`/appointments/${id}/complete`, data);
  }
}

export const appointmentsService = new AppointmentsService();
