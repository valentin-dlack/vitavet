import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Clinics } from '../Clinics';

describe('Clinics page', () => {
  it('renders title and ClinicSearch', () => {
    render(<Clinics />);
    expect(screen.getByText(/Rechercher une clinique/i)).toBeInTheDocument();
    expect(screen.getByText(/Trouvez une clinique proche de vous/i)).toBeInTheDocument();
  });
});


