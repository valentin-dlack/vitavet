import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Clinics } from './pages/Clinics';
import { ClinicDetail } from './pages/ClinicDetail';
import { ClinicAvailability } from './pages/ClinicAvailability';
import { Profile } from './pages/Profile';
import { Unauthorized } from './pages/Unauthorized';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PendingAppointments } from './pages/PendingAppointments';
import { useAuth } from './hooks/useAuth';
import { RolePanel } from './pages/RolePanel';
import { VetAgenda } from './pages/VetAgenda';

function App() {
  const { isAuthenticated, user } = useAuth();
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6">
            <Link to="/" className="font-semibold">🐾 VitaVet</Link>
            <nav className="text-sm text-gray-600 flex gap-4">
              <Link to="/clinics" className="hover:text-gray-900">Cliniques</Link>
              {isAuthenticated && ['ASV','VET','ADMIN_CLINIC'].includes((user?.role || '')) ? (
                <Link to="/panel" className="hover:text-gray-900">Panel</Link>
              ) : null}
              {isAuthenticated ? (
                <Link to="/profile" className="hover:text-gray-900">Profil</Link>
              ) : (
                <>
                  <Link to="/login" className="hover:text-gray-900">Se connecter</Link>
                  <Link to="/register" className="hover:text-gray-900">S’inscrire</Link>
                </>
              )}
            </nav>
          </div>
        </header>
        <main>
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
              <ProtectedRoute anyOfRoles={["ASV","VET","ADMIN_CLINIC"]}>
                <RolePanel />
              </ProtectedRoute>
            } />
            <Route path="/vet/agenda" element={
              <ProtectedRoute requiredRole="VET">
                <VetAgenda />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
