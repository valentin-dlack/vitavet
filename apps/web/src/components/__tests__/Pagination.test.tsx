import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders summary and hides when only one page', () => {
    const onPageChange = vi.fn();
    const { container } = render(
      <Pagination currentPage={1} totalItems={5} itemsPerPage={10} onPageChange={onPageChange} />
    );
    // null when only one page
    expect(container.firstChild).toBeNull();
  });

  it('renders and navigates between pages', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination currentPage={2} totalItems={50} itemsPerPage={10} onPageChange={onPageChange} />
    );
    expect(screen.getByText(/Affichage de/i)).toBeInTheDocument();
    // Click previous
    fireEvent.click(screen.getByText('Précédent'));
    expect(onPageChange).toHaveBeenCalledWith(1);
    // Click specific page
    fireEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
    // Click next
    fireEvent.click(screen.getByText('Suivant'));
    expect(onPageChange).toHaveBeenCalledWith(3); // from page 2 -> next asks for 3
  });

  it('disables prev on first page and next on last page', () => {
    const onPageChange = vi.fn();
    const { rerender } = render(
      <Pagination currentPage={1} totalItems={30} itemsPerPage={10} onPageChange={onPageChange} />
    );
    expect(screen.getByText('Précédent')).toBeDisabled();
    rerender(
      <Pagination currentPage={3} totalItems={30} itemsPerPage={10} onPageChange={onPageChange} />
    );
    expect(screen.getByText('Suivant')).toBeDisabled();
  });
});


