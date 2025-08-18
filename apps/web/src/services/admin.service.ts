import { httpService } from './http.service';

export interface AdminUserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  createdAt: string;
  role?: string;
}

export interface AdminClinicDto {
  id: string;
  name: string;
  city: string;
  postcode: string;
  active: boolean;
}

interface CreateUserPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

interface UpdateUserPayload {
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface CreateClinicPayload {
  name: string;
  city: string;
  postcode: string;
}

class AdminService {
  async createUser(payload: CreateUserPayload): Promise<AdminUserDto> {
    return httpService.post<AdminUserDto>('/admin/users', payload);
  }

  async updateUser(userId: string, payload: UpdateUserPayload): Promise<AdminUserDto> {
    return httpService.patch<AdminUserDto>(`/admin/users/${userId}`, payload);
  }

  async deleteUser(userId: string): Promise<void> {
    return httpService.delete<void>(`/admin/users/${userId}`);
  }

  async updateClinic(clinicId: string, payload: Partial<CreateClinicPayload>): Promise<AdminClinicDto> {
    return httpService.patch<AdminClinicDto>(`/admin/clinics/${clinicId}`, payload);
  }

  async getUsers(): Promise<AdminUserDto[]> {
    return httpService.get<AdminUserDto[]>('/admin/users');
  }

  async getClinics(): Promise<AdminClinicDto[]> {
    return httpService.get<AdminClinicDto[]>('/admin/clinics');
  }
}

export const adminService = new AdminService();
