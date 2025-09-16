import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Clinics } from './pages/Clinics';
import { ClinicDetail } from './pages/ClinicDetail';
import { ClinicAvailability } from './pages/ClinicAvailability';
import Profile from './pages/Profile';
import { Unauthorized } from './pages/Unauthorized';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PendingAppointments } from './pages/PendingAppointments';
import { useAuth } from './hooks/useAuth';
import { RolePanel } from './pages/RolePanel';
import { VetAgenda } from './pages/VetAgenda';
import { OwnerAppointments } from './pages/owner/OwnerAppointments';
import { OwnerAnimals } from './pages/owner/OwnerAnimals';
import { VetReminders } from './pages/vet/VetReminders';
import { VetAnimals } from './pages/vet/VetAnimals';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminClinics } from './pages/admin/AdminClinics';
import { AdminCreateClinic } from './pages/admin/AdminCreateClinic';
import { AdminCreateUser } from './pages/admin/AdminCreateUser';
import { AdminClinicRoles } from './pages/admin/AdminClinicRoles';
import { AdminEditUser } from './pages/admin/AdminEditUser';
import { AdminEditClinic } from './pages/admin/AdminEditClinic';
import { useEffect, useRef, useState } from 'react';
import { authService } from './services/auth.service';
import logo from './assets/logo.png';

function App() {
  const { isAuthenticated, user, roles } = useAuth();
  const userRoles = [...(roles || []), user?.role].filter(Boolean) as string[];

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = user ? `${user.firstName} ${user.lastName}` : 'Profil';

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-white focus:border focus:border-blue-600 focus:px-3 focus:py-2 focus:rounded">Aller au contenu</a>
        <header className="bg-white border-b" role="banner">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-semibold" aria-label="Accueil VitaVet">
              <img
                src={logo}
                alt="VitaVet"
                className="h-8 w-auto hidden sm:block"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <span>VitaVet</span>
            </Link>
            <nav className="text-sm text-gray-600 flex gap-4 items-center ml-auto" aria-label="Navigation principale">
              <Link to="/clinics" className="hover:text-gray-900">Cliniques</Link>
              {isAuthenticated && ['ASV','VET','ADMIN_CLINIC','OWNER','WEBMASTER'].some(r => userRoles.includes(r)) ? (
                <Link to="/panel" className="hover:text-gray-900">Panel</Link>
              ) : null}

              {!isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="hover:text-gray-900">Se connecter</Link>
                  <Link to="/register" className="rounded bg-blue-600 text-white px-3 py-1 hover:bg-blue-700">S’inscrire</Link>
                </div>
              ) : (
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 hover:text-gray-900"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    aria-label="Menu du profil"
                  >
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                      {user?.firstName?.[0]?.toUpperCase() || 'U'}
                    </span>
                    <span className="hidden sm:inline">{displayName}</span>
                  </button>
                  {menuOpen ? (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-48 rounded-md border bg-white shadow-lg z-10"
                    >
                      <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Profil</Link>
                      {['ASV','VET','ADMIN_CLINIC','OWNER','WEBMASTER'].some(r => userRoles.includes(r)) ? (
                        <Link to="/panel" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" role="menuitem">Panel</Link>
                      ) : null}
                      <button
                        type="button"
                        className="w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-gray-50 underline decoration-red-700 decoration-dotted"
                        role="menuitem"
                        onClick={() => { authService.logout(); setMenuOpen(false); }}
                      >
                        Se déconnecter
                      </button>
                    </div>
                  ) : null}
                </div>
              )}
            </nav>
          </div>
        </header>
        <main id="main-content" role="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/clinics" element={<Clinics />} />
            <Route path="/clinics/:clinicId" element={<ClinicDetail />} />
            <Route path="/clinics/:clinicId/availability" element={
              <ProtectedRoute>
                <ClinicAvailability />
              </ProtectedRoute>
            } />
            <Route path="/asv/pending" element={
              <ProtectedRoute anyOfRoles={["ASV","VET","ADMIN_CLINIC"]}>
                <PendingAppointments />
              </ProtectedRoute>
            } />
            <Route path="/panel" element={
              <ProtectedRoute anyOfRoles={["ASV","VET","ADMIN_CLINIC","OWNER","WEBMASTER"]}>
                <RolePanel />
              </ProtectedRoute>
            } />
            <Route path="/owner/appointments" element={
              <ProtectedRoute requiredRole="OWNER">
                <OwnerAppointments />
              </ProtectedRoute>
            } />
            <Route path="/owner/animals" element={
              <ProtectedRoute requiredRole="OWNER">
                <OwnerAnimals />
              </ProtectedRoute>
            } />
            <Route path="/vet/agenda" element={
              <ProtectedRoute requiredRole="VET">
                <VetAgenda />
              </ProtectedRoute>
            } />
            <Route path="/vet/reminders" element={
              <ProtectedRoute anyOfRoles={['VET', 'ADMIN_CLINIC']}>
                <VetReminders />
              </ProtectedRoute>
            } />
            <Route path="/vet/animals" element={
              <ProtectedRoute requiredRole="VET">
                <VetAnimals />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute requiredRole="WEBMASTER">
                <AdminUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/users/new" element={
              <ProtectedRoute requiredRole="WEBMASTER">
                <AdminCreateUser />
              </ProtectedRoute>
            } />
            <Route path="/admin/clinics" element={
              <ProtectedRoute requiredRole="WEBMASTER">
                <AdminClinics />
              </ProtectedRoute>
            } />
            <Route path="/admin/clinics/new" element={
              <ProtectedRoute requiredRole="WEBMASTER">
                <AdminCreateClinic />
              </ProtectedRoute>
            } />
            <Route path="/admin/clinics/:clinicId/roles" element={
              <ProtectedRoute requiredRole="WEBMASTER">
                <AdminClinicRoles />
              </ProtectedRoute>
            } />
            <Route path="/admin/users/:userId/edit" element={
              <ProtectedRoute requiredRole="WEBMASTER">
                <AdminEditUser />
              </ProtectedRoute>
            } />
            <Route path="/admin/clinics/:clinicId/edit" element={
              <ProtectedRoute requiredRole="WEBMASTER">
                <AdminEditClinic />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
