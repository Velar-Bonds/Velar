"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationType = void 0;
/**
 * Tipos de notificación in-app que el usuario recibe por eventos del ciclo de vida
 * (ofertas, contraofertas, pagos, aprobación/rechazo de bonos).
 */
exports.NotificationType = {
    OFFER_RECEIVED: 'offer_received',
    OFFER_ACCEPTED: 'offer_accepted',
    OFFER_REJECTED: 'offer_rejected',
    COUNTER_OFFER_RECEIVED: 'counter_offer_received',
    PAYMENT_CONFIRMED: 'payment_confirmed',
    BOND_APPROVED: 'bond_approved',
    BOND_REJECTED: 'bond_rejected',
    REPORT_SUBMITTED: 'report_submitted',
    REPORT_OBSERVED: 'report_observed',
    REPORT_APPROVED: 'report_approved',
    REPORT_RESUBMITTED: 'report_resubmitted',
};
