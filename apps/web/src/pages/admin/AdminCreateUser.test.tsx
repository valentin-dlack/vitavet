import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { AdminCreateUser } from './AdminCreateUser';
import { adminService } from '../../services/admin.service';

// Mock the admin service
vi.mock('../../services/admin.service');
const mockedAdminService = adminService as Mocked<typeof adminService>;

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminCreateUser', () => {
  const mockClinics = [
    { id: 'clinic-1', name: 'Test Clinic 1', city: 'Paris', postcode: '75001', active: true },
    { id: 'clinic-2', name: 'Test Clinic 2', city: 'Lyon', postcode: '69000', active: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAdminService.getClinics.mockResolvedValue(mockClinics);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AdminCreateUser />
      </BrowserRouter>
    );
  };

  it('should render the form with all fields', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/prénom/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^nom$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/rôle/i)).toBeInTheDocument();
    });
  });

  it('should show clinic selector when clinic role is selected', async () => {
    renderComponent();

    await waitFor(() => {
      const roleSelect = screen.getByLabelText(/rôle/i);
      fireEvent.change(roleSelect, { target: { value: 'VET' } });
    });

    expect(screen.getByLabelText(/clinique/i)).toBeInTheDocument();
  });

  it('should hide clinic selector when global role is selected', async () => {
    renderComponent();

    await waitFor(() => {
      const roleSelect = screen.getByLabelText(/rôle/i);
      fireEvent.change(roleSelect, { target: { value: 'OWNER' } });
    });

    expect(screen.queryByLabelText(/clinique/i)).not.toBeInTheDocument();
  });

  it('should clear clinic selection when switching to global role', async () => {
    renderComponent();

    await waitFor(() => {
      const roleSelect = screen.getByLabelText(/rôle/i);
      
      // First select a clinic role and clinic
      fireEvent.change(roleSelect, { target: { value: 'VET' } });
      
      const clinicSelect = screen.getByLabelText(/clinique/i);
      fireEvent.change(clinicSelect, { target: { value: 'clinic-1' } });
      
      // Then switch to global role
      fireEvent.change(roleSelect, { target: { value: 'OWNER' } });
    });

    expect(screen.queryByLabelText(/clinique/i)).not.toBeInTheDocument();
  });

  it('should create user with clinic role successfully', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isEmailVerified: false,
      createdAt: '2024-01-01T00:00:00Z',
      role: 'VET',
    };
    mockedAdminService.createUser.mockResolvedValue(mockUser);

    renderComponent();

    // Select clinic role first and wait for clinic select to appear
    const roleSelect = await screen.findByLabelText(/rôle/i);
    fireEvent.change(roleSelect, { target: { value: 'VET' } });
    const clinicSelect = await screen.findByLabelText(/clinique/i);
    fireEvent.change(clinicSelect, { target: { value: 'clinic-1' } });

    // Fill the rest of the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/^nom$/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'password123' } });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /créer l'utilisateur/i }));

    await waitFor(() => {
      expect(mockedAdminService.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'password123',
        role: 'VET',
        clinicId: 'clinic-1',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
  });

  it('should show error when clinic role is selected without clinic (HTML validation blocks submit)', async () => {
    renderComponent();

    // Fill the form but choose a clinic role and leave clinic unselected
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/^nom$/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'password123' } });
    const roleSelect2 = screen.getByLabelText(/rôle/i);
    fireEvent.change(roleSelect2, { target: { value: 'VET' } });

    // Attempt to submit
    fireEvent.click(screen.getByRole('button', { name: /créer l'utilisateur/i }));

    // The browser required validation prevents submit; assert no API call and clinic is required
    expect(mockedAdminService.createUser).not.toHaveBeenCalled();
    const clinicSelect2 = screen.getByLabelText(/clinique/i);
    expect(clinicSelect2).toHaveAttribute('required');
  });

  it('should clear clinic automatically when switching to global role before submit', async () => {
    mockedAdminService.createUser.mockResolvedValue({
      id: 'user-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      isEmailVerified: false,
      createdAt: '2024-01-01T00:00:00Z',
    } as any);

    renderComponent();

    await waitFor(() => {
      // Fill the form
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/^nom$/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'password123' } });
      // Select clinic role and clinic
      const rs = screen.getByLabelText(/rôle/i);
      fireEvent.change(rs, { target: { value: 'VET' } });
      const cs = screen.getByLabelText(/clinique/i);
      fireEvent.change(cs, { target: { value: 'clinic-1' } });
      // Switch to global role
      fireEvent.change(rs, { target: { value: 'OWNER' } });
      // Submit
      fireEvent.click(screen.getByRole('button', { name: /créer l'utilisateur/i }));
    });

    await waitFor(() => {
      // No global+clinic error expected
      expect(screen.queryByText(/les rôles globaux ne peuvent pas être associés à une clinique/i)).not.toBeInTheDocument();
    });
  });

  it('should handle API error', async () => {
    mockedAdminService.createUser.mockRejectedValue(new Error('User creation failed'));

    renderComponent();

    await waitFor(() => {
      // Fill the form
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/^nom$/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'password123' } });
      // Choose a valid role to pass validation
      const roleSelect = screen.getByLabelText(/rôle/i);
      fireEvent.change(roleSelect, { target: { value: 'OWNER' } });
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /créer l'utilisateur/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/user creation failed/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise<any>((resolve) => {
      resolvePromise = resolve;
    });
    mockedAdminService.createUser.mockReturnValue(promise);

    renderComponent();

    await waitFor(() => {
      // Fill the form
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
      fireEvent.change(screen.getByLabelText(/prénom/i), { target: { value: 'John' } });
      fireEvent.change(screen.getByLabelText(/^nom$/i), { target: { value: 'Doe' } });
      fireEvent.change(screen.getByLabelText(/mot de passe/i), { target: { value: 'password123' } });
      // Choose a valid role to pass validation
      const roleSelect = screen.getByLabelText(/rôle/i);
      fireEvent.change(roleSelect, { target: { value: 'OWNER' } });
      // Submit form
      fireEvent.click(screen.getByRole('button', { name: /créer l'utilisateur/i }));
    });

    await waitFor(() => {
      expect(screen.getByText(/création\.\.\./i)).toBeInTheDocument();
      expect(screen.getByText(/création\.\.\./i)).toBeDisabled();
    });

    // Resolve the promise
    resolvePromise!({ id: 'user-1' });
  });

  it('should display all role options with descriptions', async () => {
    renderComponent();

    await waitFor(() => {
      const roleSelect = screen.getByLabelText(/rôle/i);
      const options = roleSelect.querySelectorAll('option');
      
      expect(options).toHaveLength(5); // 5 role options
      expect(options[0]).toHaveTextContent(/propriétaire - rôle global/i);
      expect(options[1]).toHaveTextContent(/vétérinaire - rôle clinique/i);
      expect(options[2]).toHaveTextContent(/asv - rôle clinique/i);
      expect(options[3]).toHaveTextContent(/admin clinique - rôle clinique/i);
      expect(options[4]).toHaveTextContent(/webmaster - rôle global/i);
    });
  });
});
