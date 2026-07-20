import { z } from 'zod';
export declare const notificationRowSchema: z.ZodObject<{
    id: z.ZodString;
    user_id: z.ZodString;
    type: z.ZodNativeEnum<{
        readonly OFFER_RECEIVED: "offer_received";
        readonly OFFER_ACCEPTED: "offer_accepted";
        readonly OFFER_REJECTED: "offer_rejected";
        readonly COUNTER_OFFER_RECEIVED: "counter_offer_received";
        readonly PAYMENT_CONFIRMED: "payment_confirmed";
        readonly BOND_APPROVED: "bond_approved";
        readonly BOND_REJECTED: "bond_rejected";
    }>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    read: z.ZodBoolean;
    created_at: z.ZodString;
}, "passthrough", z.ZodTypeAny, z.objectOutputType<{
    id: z.ZodString;
    user_id: z.ZodString;
    type: z.ZodNativeEnum<{
        readonly OFFER_RECEIVED: "offer_received";
        readonly OFFER_ACCEPTED: "offer_accepted";
        readonly OFFER_REJECTED: "offer_rejected";
        readonly COUNTER_OFFER_RECEIVED: "counter_offer_received";
        readonly PAYMENT_CONFIRMED: "payment_confirmed";
        readonly BOND_APPROVED: "bond_approved";
        readonly BOND_REJECTED: "bond_rejected";
    }>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    read: z.ZodBoolean;
    created_at: z.ZodString;
}, z.ZodTypeAny, "passthrough">, z.objectInputType<{
    id: z.ZodString;
    user_id: z.ZodString;
    type: z.ZodNativeEnum<{
        readonly OFFER_RECEIVED: "offer_received";
        readonly OFFER_ACCEPTED: "offer_accepted";
        readonly OFFER_REJECTED: "offer_rejected";
        readonly COUNTER_OFFER_RECEIVED: "counter_offer_received";
        readonly PAYMENT_CONFIRMED: "payment_confirmed";
        readonly BOND_APPROVED: "bond_approved";
        readonly BOND_REJECTED: "bond_rejected";
    }>;
    payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    read: z.ZodBoolean;
    created_at: z.ZodString;
}, z.ZodTypeAny, "passthrough">>;
export declare const notificationsResponseSchema: z.ZodObject<{
    notifications: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        user_id: z.ZodString;
        type: z.ZodNativeEnum<{
            readonly OFFER_RECEIVED: "offer_received";
            readonly OFFER_ACCEPTED: "offer_accepted";
            readonly OFFER_REJECTED: "offer_rejected";
            readonly COUNTER_OFFER_RECEIVED: "counter_offer_received";
            readonly PAYMENT_CONFIRMED: "payment_confirmed";
            readonly BOND_APPROVED: "bond_approved";
            readonly BOND_REJECTED: "bond_rejected";
        }>;
        payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        read: z.ZodBoolean;
        created_at: z.ZodString;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        id: z.ZodString;
        user_id: z.ZodString;
        type: z.ZodNativeEnum<{
            readonly OFFER_RECEIVED: "offer_received";
            readonly OFFER_ACCEPTED: "offer_accepted";
            readonly OFFER_REJECTED: "offer_rejected";
            readonly COUNTER_OFFER_RECEIVED: "counter_offer_received";
            readonly PAYMENT_CONFIRMED: "payment_confirmed";
            readonly BOND_APPROVED: "bond_approved";
            readonly BOND_REJECTED: "bond_rejected";
        }>;
        payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        read: z.ZodBoolean;
        created_at: z.ZodString;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        id: z.ZodString;
        user_id: z.ZodString;
        type: z.ZodNativeEnum<{
            readonly OFFER_RECEIVED: "offer_received";
            readonly OFFER_ACCEPTED: "offer_accepted";
            readonly OFFER_REJECTED: "offer_rejected";
            readonly COUNTER_OFFER_RECEIVED: "counter_offer_received";
            readonly PAYMENT_CONFIRMED: "payment_confirmed";
            readonly BOND_APPROVED: "bond_approved";
            readonly BOND_REJECTED: "bond_rejected";
        }>;
        payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        read: z.ZodBoolean;
        created_at: z.ZodString;
    }, z.ZodTypeAny, "passthrough">>, "many">;
    unreadCount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    notifications: z.objectOutputType<{
        id: z.ZodString;
        user_id: z.ZodString;
        type: z.ZodNativeEnum<{
            readonly OFFER_RECEIVED: "offer_received";
            readonly OFFER_ACCEPTED: "offer_accepted";
            readonly OFFER_REJECTED: "offer_rejected";
            readonly COUNTER_OFFER_RECEIVED: "counter_offer_received";
            readonly PAYMENT_CONFIRMED: "payment_confirmed";
            readonly BOND_APPROVED: "bond_approved";
            readonly BOND_REJECTED: "bond_rejected";
        }>;
        payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        read: z.ZodBoolean;
        created_at: z.ZodString;
    }, z.ZodTypeAny, "passthrough">[];
    unreadCount: number;
}, {
    notifications: z.objectInputType<{
        id: z.ZodString;
        user_id: z.ZodString;
        type: z.ZodNativeEnum<{
            readonly OFFER_RECEIVED: "offer_received";
            readonly OFFER_ACCEPTED: "offer_accepted";
            readonly OFFER_REJECTED: "offer_rejected";
            readonly COUNTER_OFFER_RECEIVED: "counter_offer_received";
            readonly PAYMENT_CONFIRMED: "payment_confirmed";
            readonly BOND_APPROVED: "bond_approved";
            readonly BOND_REJECTED: "bond_rejected";
        }>;
        payload: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        read: z.ZodBoolean;
        created_at: z.ZodString;
    }, z.ZodTypeAny, "passthrough">[];
    unreadCount: number;
}>;
