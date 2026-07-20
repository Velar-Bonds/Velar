import { z } from 'zod';
export declare const notificationRowSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    type: z.ZodEnum<{
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
    }>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    read: z.ZodBoolean;
    created_at: z.ZodString;
}, z.core.$loose>;
export declare const notificationsResponseSchema: z.ZodObject<{
    notifications: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        user_id: z.ZodString;
        type: z.ZodEnum<{
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
        }>;
        payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        read: z.ZodBoolean;
        created_at: z.ZodString;
    }, z.core.$loose>>;
    unreadCount: z.ZodNumber;
}, z.core.$strip>;
