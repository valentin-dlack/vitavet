import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Clinics } from './pages/Clinics';
import { ClinicDetail } from './pages/ClinicDetail';
import { ClinicAvailability } from './pages/ClinicAvailability';
import { Profile } from './pages/Profile';
import { useAuth } from './hooks/useAuth';

function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b">
          <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-6">
            <Link to="/" className="font-semibold">🐾 VitaVet</Link>
            <nav className="text-sm text-gray-600 flex gap-4">
              <Link to="/clinics" className="hover:text-gray-900">Cliniques</Link>
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
            <Route path="/profile" element={<Profile />} />
            <Route path="/clinics" element={<Clinics />} />
            <Route path="/clinics/:clinicId" element={<ClinicDetail />} />
            <Route path="/clinics/:clinicId/availability" element={<ClinicAvailability />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
