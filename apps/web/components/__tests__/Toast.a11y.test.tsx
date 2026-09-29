import { act, render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { notify, ToastContainer } from '../Toast';

describe('Toast accessibility', () => {
  it('renders every type with and without an action without axe violations', async () => {
    const { container } = render(<ToastContainer />);

    act(() => {
      notify.ok('Operación completada');
      notify.ok('Bono registrado', { href: 'https://stellar.expert', label: 'Ver en Stellar' });
      notify.err('No se pudo completar la operación');
      notify.err('Error de publicación', { href: 'https://stellar.expert', label: 'Ver detalles' });
      notify.info('La cuenta está en preparación');
      notify.info('Transacción enviada', { href: 'https://stellar.expert', label: 'Ver transacción' });
    });

    expect(screen.getByText('Operación completada')).toBeInTheDocument();
    expect(screen.getByText('No se pudo completar la operación')).toBeInTheDocument();
    expect(screen.getByText('La cuenta está en preparación')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getAllByRole('button', { name: 'Cerrar notificación' })).toHaveLength(6);
    expect(await axe(container)).toHaveNoViolations();
  });
});