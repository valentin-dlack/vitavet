import { useEffect, useState } from 'react';
import { remindersService, type ReminderInstance } from '../../services/reminders.service';

export function VetReminders() {
  const [instances, setInstances] = useState<ReminderInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<ReminderInstance['status'] | ''>('');
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    remindersService.listInstances(statusFilter || undefined)
      .then(setInstances)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load reminders'))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleProcessDue = async () => {
    setProcessing(true);
    setProcessResult(null);
    setError(null);
    try {
      const result = await remindersService.processDue();
      setProcessResult(`${result.processed} reminders processed successfully.`);
      // Refresh list
      remindersService.listInstances(statusFilter || undefined).then(setInstances);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process reminders');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Reminder Instances</h1>
      <div className="flex justify-between items-center mb-4">
        <div>
          <label htmlFor="status-filter" className="mr-2">Filter by status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ReminderInstance['status'])}
            className="border rounded p-2"
          >
            <option value="">All</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <button
          onClick={handleProcessDue}
          disabled={processing}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {processing ? 'Processing...' : 'Process Due Reminders'}
        </button>
      </div>

      {processResult && <div className="bg-green-100 text-green-800 p-2 rounded mb-4">{processResult}</div>}
      {error && <div className="bg-red-100 text-red-800 p-2 rounded mb-4">{error}</div>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-2 px-4 border-b">Send At</th>
                <th className="py-2 px-4 border-b">Status</th>
                <th className="py-2 px-4 border-b">Appointment ID</th>
                <th className="py-2 px-4 border-b">User ID</th>
              </tr>
            </thead>
            <tbody>
              {instances.map((instance) => (
                <tr key={instance.id}>
                  <td className="py-2 px-4 border-b">{new Date(instance.sendAt).toLocaleString()}</td>
                  <td className="py-2 px-4 border-b">{instance.status}</td>
                  <td className="py-2 px-4 border-b">{instance.appointmentId}</td>
                  <td className="py-2 px-4 border-b">{instance.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
