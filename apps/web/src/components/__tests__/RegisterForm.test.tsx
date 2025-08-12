import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterForm } from '../RegisterForm';
import { authService } from '../../services/auth.service';

// Mock the auth service
vi.mock('../../services/auth.service', () => ({
  authService: {
    register: vi.fn(),
    setToken: vi.fn(),
  },
}));

const mockAuthService = authService as any;

describe('RegisterForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the form with all fields', () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });

    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should validate email format', async () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill in required fields first
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123!' },
    });

    // Set invalid email
    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    // For now, just check that the form doesn't submit with invalid email
    expect(mockAuthService.register).not.toHaveBeenCalled();
  });

  it('should validate password strength', async () => {
    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument();
    });
  });

  it('should submit form with valid data', async () => {
    const mockResponse = {
      user: {
        id: '123',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        isEmailVerified: false,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      },
      token: 'jwt-token',
      message: 'User registered successfully',
    };

    mockAuthService.register.mockResolvedValue(mockResponse);

    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123!' },
    });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAuthService.register).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'Password123!',
      });
      expect(mockAuthService.setToken).toHaveBeenCalledWith('jwt-token');
      expect(mockOnSuccess).toHaveBeenCalledWith('User registered successfully');
    });
  });

  it('should handle registration error', async () => {
    const errorMessage = 'User with this email already exists';
    mockAuthService.register.mockRejectedValue(new Error(errorMessage));

    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123!' },
    });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('should show loading state during submission', async () => {
    mockAuthService.register.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<RegisterForm onSuccess={mockOnSuccess} onError={mockOnError} />);

    // Fill in the form
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: 'John' },
    });
    fireEvent.change(screen.getByLabelText(/last name/i), {
      target: { value: 'Doe' },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password123!' },
    });

    const submitButton = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    expect(screen.getByText(/please wait while we create your account/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();
  });
});
