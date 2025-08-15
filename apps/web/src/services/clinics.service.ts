export type ClinicDto = { id: string; name: string; city: string; postcode: string };

class ClinicsService {
  private baseUrl = '/api/clinics';

  async search(postcode: string): Promise<ClinicDto[]> {
    const url = new URL(this.baseUrl, window.location.origin);
    if (postcode) url.searchParams.set('postcode', postcode);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch clinics');
    return res.json();
  }
}

export const clinicsService = new ClinicsService();


