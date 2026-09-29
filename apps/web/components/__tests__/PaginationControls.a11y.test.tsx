import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { PaginationControls } from '../PaginationControls';

describe('PaginationControls accessibility', () => {
  it.each([
    { state: 'first page', page: 1, disabled: false, previousDisabled: true, nextDisabled: false },
    { state: 'middle page', page: 2, disabled: false, previousDisabled: false, nextDisabled: false },
    { state: 'last page', page: 3, disabled: false, previousDisabled: false, nextDisabled: true },
    { state: 'disabled', page: 2, disabled: true, previousDisabled: true, nextDisabled: true },
  ])('renders correctly: $state', async ({ page, disabled, previousDisabled, nextDisabled }) => {
    const { container } = render(
      <PaginationControls page={page} limit={10} total={30} disabled={disabled} onPageChange={() => {}} />,
    );

    expect(screen.getByText(`Página ${page} de 3`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toHaveProperty('disabled', previousDisabled);
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveProperty('disabled', nextDisabled);
    expect(await axe(container)).toHaveNoViolations();
  });
});