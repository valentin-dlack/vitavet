import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Profile from '../Profile';
import { authService } from '../../services/auth.service';

// Mock the auth service
vi.mock('../../services/auth.service', () => ({
  authService: {
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    logout: vi.fn(),
    getDeletionRequestStatus: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should redirect to login if not authenticated', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);

    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should display loading state initially', () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithRouter(<Profile />);

    expect(screen.getByText('Chargement du profil...')).toBeInTheDocument();
  });

  it('should display user information when loaded successfully', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['OWNER', 'VET'],
      clinics: ['clinic-1', 'clinic-2'],
    });
    vi.mocked(authService.getDeletionRequestStatus).mockResolvedValue(null);

    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('Mon Profil')).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('OWNER')).toBeInTheDocument();
      expect(screen.getByText('VET')).toBeInTheDocument();
      expect(screen.getByText('Vous êtes associé à 2 clinique(s)')).toBeInTheDocument();
    });
  });

  it('should display error message when API call fails', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('API Error'));

    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('Erreur')).toBeInTheDocument();
      expect(screen.getByText('API Error')).toBeInTheDocument();
    });
  });

  it('should redirect to login and logout when token error occurs', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error('Invalid token'));

    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('should handle empty roles and clinics gracefully', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: [],
      clinics: [],
    });
    vi.mocked(authService.getDeletionRequestStatus).mockResolvedValue(null);

    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('Aucun rôle assigné')).toBeInTheDocument();
      expect(screen.getByText('Aucune clinique associée')).toBeInTheDocument();
    });
  });

  it('should handle logout correctly', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['OWNER'],
      clinics: [],
    });
    vi.mocked(authService.getDeletionRequestStatus).mockResolvedValue(null);

    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('Déconnexion')).toBeInTheDocument();
    });

    screen.getByText('Déconnexion').click();

    expect(authService.logout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('should have proper accessibility attributes', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['OWNER'],
      clinics: [],
    });
    vi.mocked(authService.getDeletionRequestStatus).mockResolvedValue(null);

    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(screen.getByLabelText('Modifier le profil')).toBeInTheDocument();
      expect(screen.getByLabelText('Se déconnecter')).toBeInTheDocument();
      expect(screen.getByLabelText('Retour à l\'accueil')).toBeInTheDocument();
    });
  });

  it('should display deletion request status when exists', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['OWNER'],
      clinics: [],
    });
    vi.mocked(authService.getDeletionRequestStatus).mockResolvedValue({
      id: 'req-123',
      status: 'PENDING',
      reason: 'Test reason',
      createdAt: '2024-01-01T00:00:00Z',
      adminNotes: 'Test notes',
      processedAt: undefined,
    });

    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('Demande de suppression')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });
  });

  it('should show action buttons for profile management', async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
    vi.mocked(authService.getCurrentUser).mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      roles: ['OWNER'],
      clinics: [],
    });
    vi.mocked(authService.getDeletionRequestStatus).mockResolvedValue(null);

    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(screen.getByText('Changer le mot de passe')).toBeInTheDocument();
      expect(screen.getByText('Supprimer le compte')).toBeInTheDocument();
      expect(screen.getByText('Modifier')).toBeInTheDocument();
    });
  });
});
