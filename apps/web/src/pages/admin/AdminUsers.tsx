import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/admin.service';
import type { AdminUserDto } from '../../services/admin.service';
import { useAuth } from '../../hooks/useAuth';

// Role configuration with colors and icons
const roleConfig = {
  OWNER: { label: 'Propriétaire', color: 'bg-blue-100 text-blue-800', icon: '🐾' },
  VET: { label: 'Vétérinaire', color: 'bg-green-100 text-green-800', icon: '👨‍⚕️' },
  ASV: { label: 'ASV', color: 'bg-purple-100 text-purple-800', icon: '👩‍⚕️' },
  ADMIN_CLINIC: { label: 'Admin Clinique', color: 'bg-orange-100 text-orange-800', icon: '🏥' },
  WEBMASTER: { label: 'Webmaster', color: 'bg-red-100 text-red-800', icon: '👑' },
};

export function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = () => {
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
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    const isSelf = user?.id === userId;
    const isTargetWebmaster = (target?.role || '').toUpperCase() === 'WEBMASTER';

    if (isSelf || isTargetWebmaster) {
      setError(
        isSelf
          ? 'Vous ne pouvez pas supprimer votre propre compte.'
          : 'Vous ne pouvez pas supprimer un compte webmaster.',
      );
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await adminService.deleteUser(userId);
        fetchUsers(); // Refresh list
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete user');
      }
    }
  };

  const getRoleBadge = (role: string) => {
    const config = roleConfig[role as keyof typeof roleConfig];
    if (!config) return null;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </span>
    );
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        <Link
          to="/admin/users/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
        >
          Créer un utilisateur
        </Link>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500" role="alert">{error}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr className='text-left'>
              <th className="py-2 px-4 border-b">Email</th>
              <th className="py-2 px-4 border-b">Nom</th>
              <th className="py-2 px-4 border-b">Rôle</th>
              <th className="py-2 px-4 border-b">Vérifié</th>
              <th className="py-2 px-4 border-b">Créé le</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? (
              users.map((u) => {
                const isSelf = user?.id === u.id;
                const isWebmaster = (u.role || '').toUpperCase() === 'WEBMASTER';
                const canDelete = !isSelf && !isWebmaster;
                return (
                  <tr key={u.id}>
                    <td className="py-2 px-4 border-b font-medium">{u.email}</td>
                    <td className="py-2 px-4 border-b">{u.firstName} {u.lastName}</td>
                    <td className="py-2 px-4 border-b">
                      {getRoleBadge(u.role || 'OWNER')}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.isEmailVerified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {u.isEmailVerified ? '✅ Oui' : '⏳ Non'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b text-sm text-gray-600">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 border-b space-x-2">
                      <Link to={`/admin/users/${u.id}/edit`} className="text-green-600 hover:underline">Modifier</Link>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className={`hover:underline ${canDelete ? 'text-red-600' : 'text-gray-400 cursor-not-allowed'}`}
                        disabled={!canDelete}
                        aria-disabled={!canDelete}
                        aria-label={canDelete ? 'Supprimer' : 'Suppression désactivée'}
                        title={
                          isSelf
                            ? 'Vous ne pouvez pas supprimer votre propre compte'
                            : isWebmaster
                              ? 'Vous ne pouvez pas supprimer un webmaster'
                              : 'Supprimer'
                        }
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
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
