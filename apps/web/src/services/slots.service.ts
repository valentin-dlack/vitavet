export interface GetSlotsParams {
	clinicId: string;
	date: string; // YYYY-MM-DD
	vetUserId?: string;
}

export interface AvailableSlot {
	id: string;
	startsAt: string;
	endsAt: string;
	durationMinutes: number;
	vetUserId?: string;
}

class SlotsService {
	private baseUrl = '/api/slots';

	async getAvailableSlots(params: GetSlotsParams): Promise<AvailableSlot[]> {
		const url = new URL(this.baseUrl, window.location.origin);
		url.searchParams.set('clinicId', params.clinicId);
		url.searchParams.set('date', params.date);
		if (params.vetUserId) url.searchParams.set('vetUserId', params.vetUserId);

		const res = await fetch(url.toString());
		if (!res.ok) throw new Error('Failed to fetch slots');
		return res.json();
	}
}

export const slotsService = new SlotsService();


