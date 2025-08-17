import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { useAuth } from '../../hooks/useAuth';
import { render, screen } from '@testing-library/react';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

function renderWithRouter(ui: React.ReactNode, initialEntries = ['/']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={ui} />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/unauthorized" element={<div>Unauthorized</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  it('redirects unauthenticated users to login', () => {
    mockUseAuth.mockReturnValue({ user: null, isAuthenticated: false });
    renderWithRouter(
      <ProtectedRoute>
        <div>Private</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('allows authenticated users without role restriction', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'OWNER' }, isAuthenticated: true });
    renderWithRouter(
      <ProtectedRoute>
        <div>Private</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('blocks when requiredRole does not match', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'OWNER' }, isAuthenticated: true });
    renderWithRouter(
      <ProtectedRoute requiredRole="VET">
        <div>Private</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });

  it('allows when anyOfRoles matches at least one', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'ASV' }, isAuthenticated: true });
    renderWithRouter(
      <ProtectedRoute anyOfRoles={['ASV', 'VET', 'ADMIN_CLINIC']}>
        <div>Private</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('blocks when anyOfRoles does not include user role', () => {
    mockUseAuth.mockReturnValue({ user: { role: 'OWNER' }, isAuthenticated: true });
    renderWithRouter(
      <ProtectedRoute anyOfRoles={['ASV', 'VET']}>
        <div>Private</div>
      </ProtectedRoute>
    );
    expect(screen.getByText('Unauthorized')).toBeInTheDocument();
  });
});


