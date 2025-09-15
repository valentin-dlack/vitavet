import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Home } from '../Home';
import React from 'react';
import { vi, describe, it, expect } from 'vitest';

const mockAuthState = { user: null as any, isAuthenticated: false, roles: [] as string[] };
vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}));

describe('Home page', () => {
  it('renders navigation for anonymous users', () => {
    mockAuthState.user = null;
    mockAuthState.isAuthenticated = false;
    mockAuthState.roles = [];

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /Simplifiez la gestion/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Commencer gratuitement/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Trouver une clinique/i })).toBeInTheDocument();
  });

  it('shows panel CTA when authenticated', () => {
    mockAuthState.user = { firstName: 'A', lastName: 'B' } as any;
    mockAuthState.isAuthenticated = true;

    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /Ouvrir le panel/i })).toBeInTheDocument();
  });
});


