import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LoginForm } from '../../components/LoginForm';
import { authService } from '../../services/auth.service';

vi.mock('../../services/auth.service', async () => {
  const actual = await vi.importActual<typeof import('../../services/auth.service')>('../../services/auth.service');
  return {
    ...actual,
    authService: {
      login: vi.fn(),
      setToken: vi.fn(),
      setUser: vi.fn(),
    },
  };
});

function renderWithRouter(ui: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={ui} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows validation errors when fields are empty', async () => {
    renderWithRouter(<LoginForm />);

    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByText(/l'email est requis/i)).toBeInTheDocument();
    expect(await screen.findByText(/le mot de passe est requis/i)).toBeInTheDocument();
  });

  it('shows email format error', async () => {
    renderWithRouter(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'invalid' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByText(/veuillez saisir une adresse email valide/i)).toBeInTheDocument();
  });

  it('calls login and redirects on success', async () => {
    (authService.login as unknown as Mock).mockResolvedValueOnce({ token: 'token', user: {}, message: 'ok' });

    renderWithRouter(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('shows error on failed login', async () => {
    (authService.login as unknown as Mock).mockRejectedValueOnce(new Error('Invalid credentials'));

    renderWithRouter(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(await screen.findByTestId('login-error')).toHaveTextContent('Invalid credentials');
  });
});
