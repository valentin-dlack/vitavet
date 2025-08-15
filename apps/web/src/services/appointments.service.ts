export interface CreateAppointmentData {
	clinicId: string;
	animalId: string;
	vetUserId: string;
	startsAt: string;
	typeId?: string;
}

export interface AppointmentResponse {
	id: string;
	clinicId: string;
	animalId: string;
	vetUserId: string;
	typeId?: string;
	status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED';
	startsAt: string;
	endsAt: string;
	createdAt: string;
	message?: string;
}

import { httpService } from './http.service';

class AppointmentsService {
	async createAppointment(data: CreateAppointmentData): Promise<AppointmentResponse> {
		return httpService.post<AppointmentResponse>('/appointments', data);
	}

	async getPendingAppointments(): Promise<AppointmentResponse[]> {
		return httpService.get<AppointmentResponse[]>('/appointments/pending');
	}

	async confirmAppointment(id: string): Promise<AppointmentResponse> {
		return httpService.patch<AppointmentResponse>(`/appointments/${id}/confirm`);
	}
}

export const appointmentsService = new AppointmentsService();
