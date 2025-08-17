export interface AgendaItem {
  reason?: string;
  id: string;
  startsAt: string;
  endsAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELLED' | 'BLOCKED';
  animal?: { id: string; name: string; birthdate?: string | null; species?: string | null; breed?: string | null; weightKg?: number | null };
  owner?: { id: string; firstName: string; lastName: string; email: string };
}

import { httpService } from './http.service';

class AgendaService {

  async getMyDay(date: string): Promise<AgendaItem[]> {
    const endpoint = `/agenda/me?range=day&date=${encodeURIComponent(date)}`;
    return httpService.get<AgendaItem[]>(endpoint);
  }

  async getMyWeek(date: string): Promise<AgendaItem[]> {
    const endpoint = `/agenda/me?range=week&date=${encodeURIComponent(date)}`;
    return httpService.get<AgendaItem[]>(endpoint);
  }

  async getMyMonth(date: string): Promise<AgendaItem[]> {
    const endpoint = `/agenda/me?range=month&date=${encodeURIComponent(date)}`;
    return httpService.get<AgendaItem[]>(endpoint);
  }

  async block(data: { clinicId: string; startsAt: string; endsAt: string; reason?: string }): Promise<{ id: string }>{
    return httpService.post<{ id: string }>(`/agenda/block`, data);
  }
}

export const agendaService = new AgendaService();


