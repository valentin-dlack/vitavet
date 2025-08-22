import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AdminUsers } from '../AdminUsers';
import { adminService } from '../../../services/admin.service';
import React from 'react';

// Mock the admin service
vi.mock('../../../services/admin.service');
const mockedAdminService = adminService as any;

// Mock window.confirm
const mockConfirm = vi.fn();
Object.defineProperty(window, 'confirm', {
  value: mockConfirm,
  writable: true,
});

const mockUsers = [
  {
    id: 'user-1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isEmailVerified: true,
    createdAt: '2024-01-01T00:00:00Z',
    role: 'VET',
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    isEmailVerified: false,
    createdAt: '2024-01-02T00:00:00Z',
    role: 'ASV',
  },
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(true);
  });

  it('renders the component with title and create button', async () => {
    mockedAdminService.getUsers.mockResolvedValue(mockUsers);
    
    await act(async () => {
      renderWithRouter(<AdminUsers />);
    });

    expect(screen.getByText('Gestion des utilisateurs')).toBeInTheDocument();
    expect(screen.getByText('Créer un utilisateur')).toBeInTheDocument();
  });

  it('displays loading state initially', async () => {
    mockedAdminService.getUsers.mockImplementation(() => new Promise(() => {}));
    
    await act(async () => {
      renderWithRouter(<AdminUsers />);
    });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays users in table when data is loaded', async () => {
    mockedAdminService.getUsers.mockResolvedValue(mockUsers);
    
    await act(async () => {
      renderWithRouter(<AdminUsers />);
    });

    await waitFor(() => {
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  it('displays role badges correctly', async () => {
    mockedAdminService.getUsers.mockResolvedValue(mockUsers);
    
    await act(async () => {
      renderWithRouter(<AdminUsers />);
    });

    await waitFor(() => {
      expect(screen.getByText('Vétérinaire')).toBeInTheDocument();
      expect(screen.getByText('ASV')).toBeInTheDocument();
    });
  });

  it('displays verification status correctly', async () => {
    mockedAdminService.getUsers.mockResolvedValue(mockUsers);
    
    await act(async () => {
      renderWithRouter(<AdminUsers />);
    });

    await waitFor(() => {
      expect(screen.getByText('✅ Oui')).toBeInTheDocument();
      expect(screen.getByText('⏳ Non')).toBeInTheDocument();
    });
  });

  it('shows error message when API call fails', async () => {
    const errorMessage = 'Failed to fetch users';
    mockedAdminService.getUsers.mockRejectedValue(new Error(errorMessage));
    
    await act(async () => {
      renderWithRouter(<AdminUsers />);
    });

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('shows empty state when no users found', async () => {
    mockedAdminService.getUsers.mockResolvedValue([]);
    
    await act(async () => {
      renderWithRouter(<AdminUsers />);
    });

    await waitFor(() => {
      expect(screen.getByText('Aucun utilisateur trouvé')).toBeInTheDocument();
    });
  });

  it('handles user deletion with confirmation', async () => {
    mockedAdminService.getUsers.mockResolvedValue(mockUsers);
    mockedAdminService.deleteUser.mockResolvedValue(undefined);
    
    await act(async () => {
      renderWithRouter(<AdminUsers />);
    });

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Supprimer');
      fireEvent.click(deleteButtons[0]);
    });

    expect(mockConfirm).toHaveBeenCalledWith('Êtes-vous sûr de vouloir supprimer cet utilisateur ?');
    expect(mockedAdminService.deleteUser).toHaveBeenCalledWith('user-1');
  });

  it('does not delete user when confirmation is cancelled', async () => {
    mockConfirm.mockReturnValue(false);
    mockedAdminService.getUsers.mockResolvedValue(mockUsers);
    
    await act(async () => {
      renderWithRouter(<AdminUsers />);
    });

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Supprimer');
      fireEvent.click(deleteButtons[0]);
    });

    expect(mockedAdminService.deleteUser).not.toHaveBeenCalled();
  });

  it('shows error when deletion fails', async () => {
    const errorMessage = 'Failed to delete user';
    mockedAdminService.getUsers.mockResolvedValue(mockUsers);
    mockedAdminService.deleteUser.mockRejectedValue(new Error(errorMessage));
    
    await act(async () => {
      renderWithRouter(<AdminUsers />);
    });

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Supprimer');
      fireEvent.click(deleteButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('has edit links for each user', async () => {
    mockedAdminService.getUsers.mockResolvedValue(mockUsers);
    
    await act(async () => {
      renderWithRouter(<AdminUsers />);
    });

    await waitFor(() => {
      const editLinks = screen.getAllByText('Modifier');
      expect(editLinks).toHaveLength(2);
      
      // Check that links point to correct edit pages
      expect(editLinks[0]).toHaveAttribute('href', '/admin/users/user-1/edit');
      expect(editLinks[1]).toHaveAttribute('href', '/admin/users/user-2/edit');
    });
  });
});
