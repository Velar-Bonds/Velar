/**
 * Tipos de notificación in-app que el usuario recibe por eventos del ciclo de vida
 * (ofertas, contraofertas, pagos, aprobación/rechazo de bonos).
 */
export declare const NotificationType: {
    readonly OFFER_RECEIVED: "offer_received";
    readonly OFFER_ACCEPTED: "offer_accepted";
    readonly OFFER_REJECTED: "offer_rejected";
    readonly COUNTER_OFFER_RECEIVED: "counter_offer_received";
    readonly PAYMENT_CONFIRMED: "payment_confirmed";
    readonly BOND_APPROVED: "bond_approved";
    readonly BOND_REJECTED: "bond_rejected";
    readonly REPORT_SUBMITTED: "report_submitted";
    readonly REPORT_OBSERVED: "report_observed";
    readonly REPORT_APPROVED: "report_approved";
    readonly REPORT_RESUBMITTED: "report_resubmitted";
};
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
