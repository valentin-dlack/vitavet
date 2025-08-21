import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';
import { AdminEditUser } from './AdminEditUser';
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
    useParams: () => ({ userId: 'user-1' }),
  };
});

describe('AdminEditUser', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isEmailVerified: false,
    createdAt: '2024-01-01T00:00:00Z',
    role: 'ASV',
  };

  const mockClinics = [
    { id: 'clinic-1', name: 'Test Clinic 1', city: 'Paris', postcode: '75001', active: true },
    { id: 'clinic-2', name: 'Test Clinic 2', city: 'Lyon', postcode: '69000', active: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAdminService.getUsers.mockResolvedValue([mockUser]);
    mockedAdminService.getClinics.mockResolvedValue(mockClinics);
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <AdminEditUser />
      </BrowserRouter>
    );
  };

  it('should render the form with user data', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('John')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();
      const roleSelect = screen.getByLabelText(/rôle/i) as HTMLSelectElement;
      expect(roleSelect.value).toBe('ASV');
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

  it('should update user with role change successfully', async () => {
    mockedAdminService.updateUser.mockResolvedValue(mockUser);

    renderComponent();

    await waitFor(() => {
      // Change role to clinic role
      const roleSelect = screen.getByLabelText(/rôle/i);
      fireEvent.change(roleSelect, { target: { value: 'VET' } });
      
      // Select clinic
      const clinicSelect = screen.getByLabelText(/clinique/i);
      fireEvent.change(clinicSelect, { target: { value: 'clinic-1' } });
      
      // Submit form
      fireEvent.click(screen.getByText(/mettre à jour/i));
    });

    await waitFor(() => {
      expect(mockedAdminService.updateUser).toHaveBeenCalledWith('user-1', {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'VET',
        clinicId: 'clinic-1',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
  });

  it('should update user with global role change successfully', async () => {
    mockedAdminService.updateUser.mockResolvedValue(mockUser);

    renderComponent();

    await waitFor(() => {
      // Change role to global role
      const roleSelect = screen.getByLabelText(/rôle/i);
      fireEvent.change(roleSelect, { target: { value: 'OWNER' } });
      
      // Submit form
      fireEvent.click(screen.getByText(/mettre à jour/i));
    });

    await waitFor(() => {
      expect(mockedAdminService.updateUser).toHaveBeenCalledWith('user-1', {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'OWNER',
        clinicId: undefined,
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
  });

  it('should update user without role change', async () => {
    mockedAdminService.updateUser.mockResolvedValue(mockUser);

    renderComponent();

    await waitFor(() => {
      // Change only email
      const emailInput = screen.getByLabelText(/email/i);
      fireEvent.change(emailInput, { target: { value: 'updated@example.com' } });
      // Since role is ASV (clinic role), select a clinic to satisfy validation
      const clinicSelect = screen.queryByLabelText(/clinique/i) || (() => {
        const roleSelect = screen.getByLabelText(/rôle/i);
        fireEvent.change(roleSelect, { target: { value: 'VET' } });
        return screen.getByLabelText(/clinique/i);
      })();
      fireEvent.change(clinicSelect as Element, { target: { value: 'clinic-1' } });
      
      // Submit form
      fireEvent.click(screen.getByText(/mettre à jour/i));
    });

    await waitFor(() => {
      expect(mockedAdminService.updateUser).toHaveBeenCalledWith('user-1', {
        email: 'updated@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ASV',
        clinicId: 'clinic-1',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
    });
  });

  it('should mark clinic as required when a clinic role is selected', async () => {
    renderComponent();

    await waitFor(() => {
      const roleSelect = screen.getByLabelText(/rôle/i);
      fireEvent.change(roleSelect, { target: { value: 'VET' } });
    });

    const clinicSelect = screen.getByLabelText(/clinique/i);
    expect(clinicSelect).toHaveAttribute('required');
  });

  it('should switch to global role and submit without error since clinic is cleared automatically', async () => {
    mockedAdminService.updateUser.mockResolvedValue(mockUser);

    renderComponent();

    await waitFor(() => {
      // Change role to clinic role and select clinic
      const roleSelect = screen.getByLabelText(/rôle/i);
      fireEvent.change(roleSelect, { target: { value: 'VET' } });
      const clinicSelect = screen.getByLabelText(/clinique/i);
      fireEvent.change(clinicSelect, { target: { value: 'clinic-1' } });
      // Switch to global role (form clears clinic automatically)
      fireEvent.change(roleSelect, { target: { value: 'OWNER' } });
      // Submit
      fireEvent.click(screen.getByText(/mettre à jour/i));
    });

    await waitFor(() => {
      // No global+clinic error expected; update is called
      expect(mockedAdminService.updateUser).toHaveBeenCalled();
    });
  });

  it('should handle API error', async () => {
    mockedAdminService.updateUser.mockRejectedValue(new Error('User update failed'));

    renderComponent();

    await waitFor(() => {
      // Ensure the form passes validation (pick global role)
      const roleSelect = screen.getByLabelText(/rôle/i);
      fireEvent.change(roleSelect, { target: { value: 'OWNER' } });
      // Submit form
      fireEvent.click(screen.getByText(/mettre à jour/i));
    });

    await waitFor(() => {
      expect(screen.getByText(/user update failed/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    // Create a promise that we can control
    let resolvePromise: (value: any) => void;
    const promise = new Promise<any>((resolve) => {
      resolvePromise = resolve;
    });
    mockedAdminService.updateUser.mockReturnValue(promise as unknown as Promise<any>);

    renderComponent();

    await waitFor(() => {
      // Ensure the form passes validation (pick global role)
      const roleSelect = screen.getByLabelText(/rôle/i);
      fireEvent.change(roleSelect, { target: { value: 'OWNER' } });
      // Submit form
      fireEvent.click(screen.getByText(/mettre à jour/i));
    });

    await waitFor(() => {
      expect(screen.getByText(/mise à jour\.\.\./i)).toBeInTheDocument();
      expect(screen.getByText(/mise à jour\.\.\./i)).toBeDisabled();
    });

    // Resolve the promise
    resolvePromise!({ id: 'user-1' });
  });

  it('should handle user not found', async () => {
    mockedAdminService.getUsers.mockResolvedValue([]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/utilisateur non trouvé/i)).toBeInTheDocument();
    });
  });

  it('should handle fetch error', async () => {
    mockedAdminService.getUsers.mockRejectedValue(new Error('Failed to fetch user'));

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch user/i)).toBeInTheDocument();
    });
  });

  it('should navigate back when cancel is clicked', async () => {
    renderComponent();

    await waitFor(() => {
      fireEvent.click(screen.getByText(/annuler/i));
    });

    expect(mockNavigate).toHaveBeenCalledWith('/admin/users');
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
