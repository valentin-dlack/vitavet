import { useEffect, useState } from 'react';
import { adminService } from '../../services/admin.service';
import type { AdminUserDto } from '../../services/admin.service';

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    adminService
      .getUsers()
      .then((data) => {
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error('Error fetching users:', e);
        setError(e instanceof Error ? e.message : 'An error occurred');
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gestion des utilisateurs</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className='text-left'>
              <th className="py-2 px-4 border-b">ID</th>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Nom</th>
              <th className="py-2 px-4 border-b">Vérifié</th>
              <th className="py-2 px-4 border-b">Créé le</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="py-2 px-4 border-b">{user.id}</td>
                  <td className="py-2 px-4 border-b">{user.email}</td>
                  <td className="py-2 px-4 border-b">{user.firstName} {user.lastName}</td>
                  <td className="py-2 px-4 border-b">{user.isEmailVerified ? 'Oui' : 'Non'}</td>
                  <td className="py-2 px-4 border-b">{new Date(user.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
                  {loading ? 'Chargement des utilisateurs...' : 'Aucun utilisateur trouvé'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
