import { useEffect } from 'react';
import { httpService } from '../services/http.service';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export function HealthCheck() {
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await httpService.get<HealthStatus>('/health');
         
        console.info('[VitaVet] API health', data);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
         
        console.warn('[VitaVet] API health error', message);
      }
    };

    checkHealth();
  }, []);

  return null;
}
