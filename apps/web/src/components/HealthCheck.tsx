import { useState, useEffect } from 'react';
import { httpService } from '../services/http.service';

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export function HealthCheck() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const data = await httpService.get<HealthStatus>('/health');
        setHealth(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
  }, []);

  if (loading) {
    return <div data-testid="health-loading">Checking health...</div>;
  }

  if (error) {
    return <div data-testid="health-error">Error: {error}</div>;
  }

  if (!health) {
    return <div data-testid="health-no-data">No health data</div>;
  }

  return (
    <div data-testid="health-status">
      <h2>API Health Status</h2>
      <p>Status: {health.status}</p>
      <p>Environment: {health.environment}</p>
      <p>Uptime: {health.uptime.toFixed(2)}s</p>
      <p>Last Check: {new Date(health.timestamp).toLocaleString()}</p>
    </div>
  );
}
