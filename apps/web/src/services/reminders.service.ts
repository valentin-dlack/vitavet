import { httpService } from './http.service';

export interface ReminderInstance {
  id: string;
  ruleId: string;
  userId: string;
  appointmentId: string;
  sendAt: string;
  status: 'SCHEDULED' | 'SENT' | 'FAILED' | 'CANCELLED';
  payload: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

class RemindersService {
  async listInstances(status?: ReminderInstance['status']): Promise<ReminderInstance[]> {
    const url = status ? `/reminders/instances?status=${encodeURIComponent(status)}` : '/reminders/instances';
    return httpService.get<ReminderInstance[]>(url);
  }

  async processDue(): Promise<{ processed: number }> {
    return httpService.post<{ processed: number }>('/reminders/run-due');
  }
}

export const remindersService = new RemindersService();
