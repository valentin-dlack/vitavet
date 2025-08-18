import { httpService } from './http.service';

export interface AdminUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface AdminClinicDto {
  id: string;
  name: string;
  city: string;
  postcode: string;
  active: boolean;
}

class AdminService {
  async getUsers(): Promise<AdminUserDto[]> {
    return httpService.get<AdminUserDto[]>('/admin/users');
  }

  async getClinics(): Promise<AdminClinicDto[]> {
    return httpService.get<AdminClinicDto[]>('/admin/clinics');
  }
}

export const adminService = new AdminService();
