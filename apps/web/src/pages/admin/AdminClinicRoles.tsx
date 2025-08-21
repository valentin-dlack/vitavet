import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { adminService, type AdminUserDto } from '../../services/admin.service';
import { clinicsService } from '../../services/clinics.service';
import type { ClinicDto, UserClinicRoleDto } from '../../services/clinics.service';

export function AdminClinicRoles() {
  const { clinicId } = useParams<{ clinicId: string }>();
  const [roles, setRoles] = useState<UserClinicRoleDto[]>([]);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [clinic, setClinic] = useState<ClinicDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('ASV');

  useEffect(() => {
    if (!clinicId) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [clinicData, rolesData, usersData] = await Promise.all([
          clinicsService.getById(clinicId),
          clinicsService.getClinicRoles(clinicId),
          adminService.getUsers(),
        ]);
        setClinic(clinicData);
        setRoles(rolesData);
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clinicId]);

  const handleAssignRole = async () => {
    if (!clinicId || !selectedUserId || !selectedRole) return;
    try {
      await clinicsService.assignRole(clinicId, selectedUserId, selectedRole);
      // Refresh roles
      const rolesData = await clinicsService.getClinicRoles(clinicId);
      setRoles(rolesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign role');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!clinic) return <p>Clinic not found.</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gérer les Rôles pour {clinic.name}</h1>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-2">Assigner un Nouveau Rôle</h2>
        <div className="flex gap-4">
          <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} className="p-2 border rounded">
            <option value="">Sélectionner un utilisateur</option>
            {users.map(user => <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.email})</option>)}
          </select>
          <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="p-2 border rounded">
            <option value="ASV">ASV</option>
            <option value="VET">Vétérinaire</option>
            <option value="MANAGER_CLINIC">Manager</option>
          </select>
          <button onClick={handleAssignRole} className="bg-indigo-600 text-white px-4 py-2 rounded">Assigner</button>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Rôles Actuels</h2>
        <ul className="space-y-2">
          {roles.map(role => (
            <li key={role.userId} className="p-2 border rounded flex justify-between items-center">
              <span>{role.user?.firstName} {role.user?.lastName}</span>
              <span className="font-mono bg-gray-100 px-2 py-1 rounded">{role.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
