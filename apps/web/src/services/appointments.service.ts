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

class AppointmentsService {
	private baseUrl = '/api/appointments';

	async createAppointment(data: CreateAppointmentData): Promise<AppointmentResponse> {
		const response = await fetch(this.baseUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(data),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Failed to create appointment');
		}

		return response.json();
	}

	async getPendingAppointments(): Promise<AppointmentResponse[]> {
		const response = await fetch(`${this.baseUrl}/pending`);
		
		if (!response.ok) {
			throw new Error('Failed to fetch pending appointments');
		}

		return response.json();
	}

	async confirmAppointment(id: string): Promise<AppointmentResponse> {
		const response = await fetch(`${this.baseUrl}/${id}/confirm`, {
			method: 'PATCH',
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || 'Failed to confirm appointment');
		}

		return response.json();
	}
}

export const appointmentsService = new AppointmentsService();
