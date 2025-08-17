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

class ClinicsService {
  private baseUrl = '/api/clinics';

  async search(postcode: string, serviceSlugs?: string[]): Promise<ClinicDto[]> {
    const url = new URL(this.baseUrl, window.location.origin);
    if (postcode) url.searchParams.set('postcode', postcode);
    if (serviceSlugs && serviceSlugs.length) url.searchParams.set('services', serviceSlugs.join(','));
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch clinics');
    return res.json();
  }

  async getVetsByClinic(clinicId: string): Promise<Vet[]> {
    const res = await fetch(`/api/clinics/${clinicId}/vets`);
    if (!res.ok) throw new Error('Failed to fetch vets');
    return res.json();
  }

  async getById(id: string): Promise<ClinicDetailDto> {
    const res = await fetch(`/api/clinics/${id}`);
    if (!res.ok) throw new Error('Failed to fetch clinic');
    return res.json();
  }

  async listServices(): Promise<ServiceDto[]> {
    const res = await fetch(`/api/clinics/services/list`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  }
}

export const clinicsService = new ClinicsService();


