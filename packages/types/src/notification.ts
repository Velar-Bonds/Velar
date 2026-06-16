/**
 * Tipos de notificación in-app que el usuario recibe por eventos del ciclo de vida
 * (ofertas, contraofertas, pagos, aprobación/rechazo de bonos).
 */
export const NotificationType = {
  OFFER_RECEIVED: 'offer_received',
  OFFER_ACCEPTED: 'offer_accepted',
  OFFER_REJECTED: 'offer_rejected',
  COUNTER_OFFER_RECEIVED: 'counter_offer_received',
  PAYMENT_CONFIRMED: 'payment_confirmed',
  BOND_APPROVED: 'bond_approved',
  BOND_REJECTED: 'bond_rejected',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export interface Notification {
  id: string;
  /** Profile id del destinatario. */
  userId: string;
  type: NotificationType;
  /** Datos suficientes para renderizar el mensaje sin consultas extra. */
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}
