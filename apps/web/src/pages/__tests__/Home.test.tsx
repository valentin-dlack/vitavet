import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Home } from '../Home';
import { authService } from '../../services/auth.service';
import React from 'react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('../../services/auth.service', () => ({
  authService: {
    isAuthenticated: vi.fn().mockReturnValue(false),
    getUser: vi.fn().mockReturnValue(null),
    logout: vi.fn(),
  },
}));

describe('Home page', () => {
  it('renders navigation for anonymous users', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByText(/VitaVet/i)).toBeInTheDocument();
    expect(screen.getByText(/Créer un compte/i)).toBeInTheDocument();
    expect(screen.getByText(/Se connecter/i)).toBeInTheDocument();
    expect(screen.getByText(/Rechercher une clinique/i)).toBeInTheDocument();
  });

  it('shows welcome and allows logout when authenticated', () => {
    (authService.isAuthenticated as any).mockReturnValue(true);
    (authService.getUser as any).mockReturnValue({ firstName: 'A', lastName: 'B' });
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('welcome-message')).toHaveTextContent('Bienvenue, A B');
    fireEvent.click(screen.getByRole('button', { name: /Se déconnecter/i }));
    expect(authService.logout).toHaveBeenCalled();
  });
});


