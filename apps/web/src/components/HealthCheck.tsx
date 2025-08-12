import { useState, useEffect } from 'react';

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
        const response = await fetch('/api/health');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
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
