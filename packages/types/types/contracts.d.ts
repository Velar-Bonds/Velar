import { z } from 'zod';
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
/**
 * Versioned single source of truth for the public JSON surface covered by issue #43.
 * Binary downloads are intentionally excluded; multipart upload validates its response only.
 */
export declare const apiContracts: {
    readonly 'auth.register': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodEffects<z.ZodObject<{
            email: z.ZodString;
            password: z.ZodString;
            perspectiva: z.ZodEnum<["usuario", "partido"]>;
            nombres: z.ZodOptional<z.ZodString>;
            apellidos: z.ZodOptional<z.ZodString>;
            identificacion: z.ZodOptional<z.ZodString>;
            telefono: z.ZodOptional<z.ZodString>;
            direccion: z.ZodOptional<z.ZodString>;
            nombrePartido: z.ZodOptional<z.ZodString>;
            codigo: z.ZodOptional<z.ZodString>;
            representanteLegal: z.ZodOptional<z.ZodString>;
            cedulaJuridica: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            email: string;
            password: string;
            perspectiva: "usuario" | "partido";
            nombres?: string | undefined;
            apellidos?: string | undefined;
            identificacion?: string | undefined;
            telefono?: string | undefined;
            direccion?: string | undefined;
            nombrePartido?: string | undefined;
            codigo?: string | undefined;
            representanteLegal?: string | undefined;
            cedulaJuridica?: string | undefined;
        }, {
            email: string;
            password: string;
            perspectiva: "usuario" | "partido";
            nombres?: string | undefined;
            apellidos?: string | undefined;
            identificacion?: string | undefined;
            telefono?: string | undefined;
            direccion?: string | undefined;
            nombrePartido?: string | undefined;
            codigo?: string | undefined;
            representanteLegal?: string | undefined;
            cedulaJuridica?: string | undefined;
        }>, {
            email: string;
            password: string;
            perspectiva: "usuario" | "partido";
            nombres?: string | undefined;
            apellidos?: string | undefined;
            identificacion?: string | undefined;
            telefono?: string | undefined;
            direccion?: string | undefined;
            nombrePartido?: string | undefined;
            codigo?: string | undefined;
            representanteLegal?: string | undefined;
            cedulaJuridica?: string | undefined;
        }, {
            email: string;
            password: string;
            perspectiva: "usuario" | "partido";
            nombres?: string | undefined;
            apellidos?: string | undefined;
            identificacion?: string | undefined;
            telefono?: string | undefined;
            direccion?: string | undefined;
            nombrePartido?: string | undefined;
            codigo?: string | undefined;
            representanteLegal?: string | undefined;
            cedulaJuridica?: string | undefined;
        }>;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            role: z.ZodEnum<["comprador", "emisor"]>;
            perspectiva: z.ZodEnum<["usuario", "partido"]>;
            partyId: z.ZodNullable<z.ZodString>;
            wallet: z.ZodNullable<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            email: z.ZodString;
            role: z.ZodEnum<["comprador", "emisor"]>;
            perspectiva: z.ZodEnum<["usuario", "partido"]>;
            partyId: z.ZodNullable<z.ZodString>;
            wallet: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            email: z.ZodString;
            role: z.ZodEnum<["comprador", "emisor"]>;
            perspectiva: z.ZodEnum<["usuario", "partido"]>;
            partyId: z.ZodNullable<z.ZodString>;
            wallet: z.ZodNullable<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'auth.login': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            email: z.ZodString;
            password: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            email: string;
            password: string;
        }, {
            email: string;
            password: string;
        }>;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            access_token: z.ZodString;
            refresh_token: z.ZodString;
            expires_in: z.ZodNumber;
            token_type: z.ZodString;
            user: z.ZodUnknown;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            access_token: z.ZodString;
            refresh_token: z.ZodString;
            expires_in: z.ZodNumber;
            token_type: z.ZodString;
            user: z.ZodUnknown;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            access_token: z.ZodString;
            refresh_token: z.ZodString;
            expires_in: z.ZodNumber;
            token_type: z.ZodString;
            user: z.ZodUnknown;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{
            page: z.ZodOptional<z.ZodNumber>;
            limit: z.ZodOptional<z.ZodNumber>;
            country: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            page: z.ZodOptional<z.ZodNumber>;
            limit: z.ZodOptional<z.ZodNumber>;
            country: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            page: z.ZodOptional<z.ZodNumber>;
            limit: z.ZodOptional<z.ZodNumber>;
            country: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>;
        response: z.ZodObject<{
            data: z.ZodArray<z.ZodObject<{
                token_id: z.ZodString;
                bond_id: z.ZodString;
                issuer_party_id: z.ZodString;
                current_owner: z.ZodNullable<z.ZodString>;
                status: z.ZodNativeEnum<{
                    readonly EMITIDO: "emitido";
                    readonly PENDIENTE: "pendiente";
                    readonly APROBADO: "aprobado";
                    readonly ACTIVO: "activo";
                    readonly EN_VENTA: "en_venta";
                    readonly EN_ESCROW: "en_escrow";
                    readonly TRANSFERIDO: "transferido";
                    readonly CANCELADO: "cancelado";
                    readonly RECHAZADO: "rechazado";
                    readonly CONGELADO: "congelado";
                }>;
                document_hash: z.ZodString;
                metadata_uri: z.ZodNullable<z.ZodString>;
                face_value: z.ZodNullable<z.ZodNumber>;
                certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                currency: z.ZodOptional<z.ZodString>;
                interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                country: z.ZodOptional<z.ZodString>;
                payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
                stellar_status: z.ZodOptional<z.ZodString>;
                stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                token_id: z.ZodString;
                bond_id: z.ZodString;
                issuer_party_id: z.ZodString;
                current_owner: z.ZodNullable<z.ZodString>;
                status: z.ZodNativeEnum<{
                    readonly EMITIDO: "emitido";
                    readonly PENDIENTE: "pendiente";
                    readonly APROBADO: "aprobado";
                    readonly ACTIVO: "activo";
                    readonly EN_VENTA: "en_venta";
                    readonly EN_ESCROW: "en_escrow";
                    readonly TRANSFERIDO: "transferido";
                    readonly CANCELADO: "cancelado";
                    readonly RECHAZADO: "rechazado";
                    readonly CONGELADO: "congelado";
                }>;
                document_hash: z.ZodString;
                metadata_uri: z.ZodNullable<z.ZodString>;
                face_value: z.ZodNullable<z.ZodNumber>;
                certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                currency: z.ZodOptional<z.ZodString>;
                interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                country: z.ZodOptional<z.ZodString>;
                payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
                stellar_status: z.ZodOptional<z.ZodString>;
                stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                token_id: z.ZodString;
                bond_id: z.ZodString;
                issuer_party_id: z.ZodString;
                current_owner: z.ZodNullable<z.ZodString>;
                status: z.ZodNativeEnum<{
                    readonly EMITIDO: "emitido";
                    readonly PENDIENTE: "pendiente";
                    readonly APROBADO: "aprobado";
                    readonly ACTIVO: "activo";
                    readonly EN_VENTA: "en_venta";
                    readonly EN_ESCROW: "en_escrow";
                    readonly TRANSFERIDO: "transferido";
                    readonly CANCELADO: "cancelado";
                    readonly RECHAZADO: "rechazado";
                    readonly CONGELADO: "congelado";
                }>;
                document_hash: z.ZodString;
                metadata_uri: z.ZodNullable<z.ZodString>;
                face_value: z.ZodNullable<z.ZodNumber>;
                certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                currency: z.ZodOptional<z.ZodString>;
                interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                country: z.ZodOptional<z.ZodString>;
                payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
                stellar_status: z.ZodOptional<z.ZodString>;
                stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            total: z.ZodNumber;
            page: z.ZodNumber;
            limit: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            data: z.objectOutputType<{
                token_id: z.ZodString;
                bond_id: z.ZodString;
                issuer_party_id: z.ZodString;
                current_owner: z.ZodNullable<z.ZodString>;
                status: z.ZodNativeEnum<{
                    readonly EMITIDO: "emitido";
                    readonly PENDIENTE: "pendiente";
                    readonly APROBADO: "aprobado";
                    readonly ACTIVO: "activo";
                    readonly EN_VENTA: "en_venta";
                    readonly EN_ESCROW: "en_escrow";
                    readonly TRANSFERIDO: "transferido";
                    readonly CANCELADO: "cancelado";
                    readonly RECHAZADO: "rechazado";
                    readonly CONGELADO: "congelado";
                }>;
                document_hash: z.ZodString;
                metadata_uri: z.ZodNullable<z.ZodString>;
                face_value: z.ZodNullable<z.ZodNumber>;
                certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                currency: z.ZodOptional<z.ZodString>;
                interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                country: z.ZodOptional<z.ZodString>;
                payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
                stellar_status: z.ZodOptional<z.ZodString>;
                stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
            total: number;
        }, {
            page: number;
            limit: number;
            data: z.objectInputType<{
                token_id: z.ZodString;
                bond_id: z.ZodString;
                issuer_party_id: z.ZodString;
                current_owner: z.ZodNullable<z.ZodString>;
                status: z.ZodNativeEnum<{
                    readonly EMITIDO: "emitido";
                    readonly PENDIENTE: "pendiente";
                    readonly APROBADO: "aprobado";
                    readonly ACTIVO: "activo";
                    readonly EN_VENTA: "en_venta";
                    readonly EN_ESCROW: "en_escrow";
                    readonly TRANSFERIDO: "transferido";
                    readonly CANCELADO: "cancelado";
                    readonly RECHAZADO: "rechazado";
                    readonly CONGELADO: "congelado";
                }>;
                document_hash: z.ZodString;
                metadata_uri: z.ZodNullable<z.ZodString>;
                face_value: z.ZodNullable<z.ZodNumber>;
                certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                currency: z.ZodOptional<z.ZodString>;
                interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                country: z.ZodOptional<z.ZodString>;
                payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
                stellar_status: z.ZodOptional<z.ZodString>;
                stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
            total: number;
        }>;
    };
    readonly 'bonds.requests.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            requested_by: z.ZodString;
            status: z.ZodEnum<["pendiente", "aprobado", "rechazado"]>;
            face_value: z.ZodNumber;
            currency: z.ZodString;
            interest_rate: z.ZodNullable<z.ZodNumber>;
            issue_date: z.ZodNullable<z.ZodString>;
            maturity_date: z.ZodNullable<z.ZodString>;
            bond_token_id: z.ZodNullable<z.ZodString>;
            rejection_reason: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            requested_by: z.ZodString;
            status: z.ZodEnum<["pendiente", "aprobado", "rechazado"]>;
            face_value: z.ZodNumber;
            currency: z.ZodString;
            interest_rate: z.ZodNullable<z.ZodNumber>;
            issue_date: z.ZodNullable<z.ZodString>;
            maturity_date: z.ZodNullable<z.ZodString>;
            bond_token_id: z.ZodNullable<z.ZodString>;
            rejection_reason: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            requested_by: z.ZodString;
            status: z.ZodEnum<["pendiente", "aprobado", "rechazado"]>;
            face_value: z.ZodNumber;
            currency: z.ZodString;
            interest_rate: z.ZodNullable<z.ZodNumber>;
            issue_date: z.ZodNullable<z.ZodString>;
            maturity_date: z.ZodNullable<z.ZodString>;
            bond_token_id: z.ZodNullable<z.ZodString>;
            rejection_reason: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    };
    readonly 'bonds.requests.create': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodEffects<z.ZodObject<{
            faceValue: z.ZodNumber;
            currency: z.ZodOptional<z.ZodString>;
            interestRate: z.ZodOptional<z.ZodNumber>;
            series: z.ZodOptional<z.ZodString>;
            issueDate: z.ZodOptional<z.ZodString>;
            maturityDate: z.ZodOptional<z.ZodString>;
            notes: z.ZodOptional<z.ZodString>;
            certificateNumber: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            faceValue: number;
            certificateNumber?: string | undefined;
            currency?: string | undefined;
            interestRate?: number | undefined;
            series?: string | undefined;
            issueDate?: string | undefined;
            maturityDate?: string | undefined;
            notes?: string | undefined;
        }, {
            faceValue: number;
            certificateNumber?: string | undefined;
            currency?: string | undefined;
            interestRate?: number | undefined;
            series?: string | undefined;
            issueDate?: string | undefined;
            maturityDate?: string | undefined;
            notes?: string | undefined;
        }>, {
            faceValue: number;
            certificateNumber?: string | undefined;
            currency?: string | undefined;
            interestRate?: number | undefined;
            series?: string | undefined;
            issueDate?: string | undefined;
            maturityDate?: string | undefined;
            notes?: string | undefined;
        }, {
            faceValue: number;
            certificateNumber?: string | undefined;
            currency?: string | undefined;
            interestRate?: number | undefined;
            series?: string | undefined;
            issueDate?: string | undefined;
            maturityDate?: string | undefined;
            notes?: string | undefined;
        }>;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            requested_by: z.ZodString;
            status: z.ZodEnum<["pendiente", "aprobado", "rechazado"]>;
            face_value: z.ZodNumber;
            currency: z.ZodString;
            interest_rate: z.ZodNullable<z.ZodNumber>;
            issue_date: z.ZodNullable<z.ZodString>;
            maturity_date: z.ZodNullable<z.ZodString>;
            bond_token_id: z.ZodNullable<z.ZodString>;
            rejection_reason: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            requested_by: z.ZodString;
            status: z.ZodEnum<["pendiente", "aprobado", "rechazado"]>;
            face_value: z.ZodNumber;
            currency: z.ZodString;
            interest_rate: z.ZodNullable<z.ZodNumber>;
            issue_date: z.ZodNullable<z.ZodString>;
            maturity_date: z.ZodNullable<z.ZodString>;
            bond_token_id: z.ZodNullable<z.ZodString>;
            rejection_reason: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            requested_by: z.ZodString;
            status: z.ZodEnum<["pendiente", "aprobado", "rechazado"]>;
            face_value: z.ZodNumber;
            currency: z.ZodString;
            interest_rate: z.ZodNullable<z.ZodNumber>;
            issue_date: z.ZodNullable<z.ZodString>;
            maturity_date: z.ZodNullable<z.ZodString>;
            bond_token_id: z.ZodNullable<z.ZodString>;
            rejection_reason: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.requests.approve': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.requests.reject': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            reason: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            reason?: string | undefined;
        }, {
            reason?: string | undefined;
        }>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            ok: z.ZodLiteral<true>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            ok: z.ZodLiteral<true>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            ok: z.ZodLiteral<true>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.available': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{
            country: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            country: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            country: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>;
        response: z.ZodArray<z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    };
    readonly 'bonds.create': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodEffects<z.ZodObject<{
            bondId: z.ZodString;
            issuerPartyId: z.ZodString;
            documentHash: z.ZodString;
            metadataUri: z.ZodOptional<z.ZodString>;
            faceValue: z.ZodOptional<z.ZodNumber>;
            initialOwner: z.ZodOptional<z.ZodString>;
            certificateNumber: z.ZodOptional<z.ZodString>;
            currency: z.ZodOptional<z.ZodString>;
            interestRate: z.ZodOptional<z.ZodNumber>;
            series: z.ZodOptional<z.ZodString>;
            issueDate: z.ZodOptional<z.ZodString>;
            maturityDate: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            bondId: string;
            issuerPartyId: string;
            documentHash: string;
            metadataUri?: string | undefined;
            faceValue?: number | undefined;
            initialOwner?: string | undefined;
            certificateNumber?: string | undefined;
            currency?: string | undefined;
            interestRate?: number | undefined;
            series?: string | undefined;
            issueDate?: string | undefined;
            maturityDate?: string | undefined;
        }, {
            bondId: string;
            issuerPartyId: string;
            documentHash: string;
            metadataUri?: string | undefined;
            faceValue?: number | undefined;
            initialOwner?: string | undefined;
            certificateNumber?: string | undefined;
            currency?: string | undefined;
            interestRate?: number | undefined;
            series?: string | undefined;
            issueDate?: string | undefined;
            maturityDate?: string | undefined;
        }>, {
            bondId: string;
            issuerPartyId: string;
            documentHash: string;
            metadataUri?: string | undefined;
            faceValue?: number | undefined;
            initialOwner?: string | undefined;
            certificateNumber?: string | undefined;
            currency?: string | undefined;
            interestRate?: number | undefined;
            series?: string | undefined;
            issueDate?: string | undefined;
            maturityDate?: string | undefined;
        }, {
            bondId: string;
            issuerPartyId: string;
            documentHash: string;
            metadataUri?: string | undefined;
            faceValue?: number | undefined;
            initialOwner?: string | undefined;
            certificateNumber?: string | undefined;
            currency?: string | undefined;
            interestRate?: number | undefined;
            series?: string | undefined;
            issueDate?: string | undefined;
            maturityDate?: string | undefined;
        }>;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.get': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tokenId: string;
        }, {
            tokenId: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.onchain': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tokenId: string;
        }, {
            tokenId: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            enabled: z.ZodBoolean;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            enabled: z.ZodBoolean;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            enabled: z.ZodBoolean;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.issueOnchain': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tokenId: string;
        }, {
            tokenId: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            ok: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
            alreadyIssued: z.ZodOptional<z.ZodBoolean>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            ok: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
            alreadyIssued: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            ok: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
            alreadyIssued: z.ZodOptional<z.ZodBoolean>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.publish': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            paymentMethods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
        }, "strict", z.ZodTypeAny, {
            paymentMethods?: ("sinpe" | "transferencia" | "wallet")[] | undefined;
        }, {
            paymentMethods?: ("sinpe" | "transferencia" | "wallet")[] | undefined;
        }>;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tokenId: string;
        }, {
            tokenId: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.sorobanDetails': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tokenId: string;
        }, {
            tokenId: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            source: z.ZodEnum<["soroban", "database_snapshot"]>;
            contract_id: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            source: z.ZodEnum<["soroban", "database_snapshot"]>;
            contract_id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            source: z.ZodEnum<["soroban", "database_snapshot"]>;
            contract_id: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.freeze': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tokenId: string;
        }, {
            tokenId: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.unfreeze': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tokenId: string;
        }, {
            tokenId: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodNativeEnum<{
                readonly EMITIDO: "emitido";
                readonly PENDIENTE: "pendiente";
                readonly APROBADO: "aprobado";
                readonly ACTIVO: "activo";
                readonly EN_VENTA: "en_venta";
                readonly EN_ESCROW: "en_escrow";
                readonly TRANSFERIDO: "transferido";
                readonly CANCELADO: "cancelado";
                readonly RECHAZADO: "rechazado";
                readonly CONGELADO: "congelado";
            }>;
            document_hash: z.ZodString;
            metadata_uri: z.ZodNullable<z.ZodString>;
            face_value: z.ZodNullable<z.ZodNumber>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<["sinpe", "transferencia", "wallet"]>, "many">>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.uploadDocument': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUnknown;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            tokenId: string;
        }, {
            tokenId: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            documentHash: z.ZodString;
            sorobanTxHash: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            documentHash: z.ZodString;
            sorobanTxHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            documentHash: z.ZodString;
            sorobanTxHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'bonds.hash': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            content: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            content: string;
        }, {
            content: string;
        }>;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            hash: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            hash: string;
        }, {
            hash: string;
        }>;
    };
    readonly 'transfers.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{
            page: z.ZodOptional<z.ZodNumber>;
            limit: z.ZodOptional<z.ZodNumber>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            page: z.ZodOptional<z.ZodNumber>;
            limit: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            page: z.ZodOptional<z.ZodNumber>;
            limit: z.ZodOptional<z.ZodNumber>;
        }, z.ZodTypeAny, "passthrough">>;
        response: z.ZodObject<{
            data: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                bond_token_id: z.ZodString;
                from_owner: z.ZodString;
                to_owner: z.ZodString;
                status: z.ZodNativeEnum<{
                    readonly SOLICITADA: "solicitada";
                    readonly ACEPTADA: "aceptada";
                    readonly CONTRAOFERTA: "contraoferta";
                    readonly EN_ESCROW: "en_escrow";
                    readonly PAGO_REGISTRADO: "pago_registrado";
                    readonly PAGO_VALIDADO: "pago_validado";
                    readonly LIBERADA: "liberada";
                    readonly RECHAZADA: "rechazada";
                    readonly CANCELADA: "cancelada";
                }>;
                escrow_contract_id: z.ZodNullable<z.ZodString>;
                payment_evidence_hash: z.ZodNullable<z.ZodString>;
                validated_by: z.ZodNullable<z.ZodString>;
                amount: z.ZodNullable<z.ZodNumber>;
                counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
                id: z.ZodString;
                bond_token_id: z.ZodString;
                from_owner: z.ZodString;
                to_owner: z.ZodString;
                status: z.ZodNativeEnum<{
                    readonly SOLICITADA: "solicitada";
                    readonly ACEPTADA: "aceptada";
                    readonly CONTRAOFERTA: "contraoferta";
                    readonly EN_ESCROW: "en_escrow";
                    readonly PAGO_REGISTRADO: "pago_registrado";
                    readonly PAGO_VALIDADO: "pago_validado";
                    readonly LIBERADA: "liberada";
                    readonly RECHAZADA: "rechazada";
                    readonly CANCELADA: "cancelada";
                }>;
                escrow_contract_id: z.ZodNullable<z.ZodString>;
                payment_evidence_hash: z.ZodNullable<z.ZodString>;
                validated_by: z.ZodNullable<z.ZodString>;
                amount: z.ZodNullable<z.ZodNumber>;
                counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
                id: z.ZodString;
                bond_token_id: z.ZodString;
                from_owner: z.ZodString;
                to_owner: z.ZodString;
                status: z.ZodNativeEnum<{
                    readonly SOLICITADA: "solicitada";
                    readonly ACEPTADA: "aceptada";
                    readonly CONTRAOFERTA: "contraoferta";
                    readonly EN_ESCROW: "en_escrow";
                    readonly PAGO_REGISTRADO: "pago_registrado";
                    readonly PAGO_VALIDADO: "pago_validado";
                    readonly LIBERADA: "liberada";
                    readonly RECHAZADA: "rechazada";
                    readonly CANCELADA: "cancelada";
                }>;
                escrow_contract_id: z.ZodNullable<z.ZodString>;
                payment_evidence_hash: z.ZodNullable<z.ZodString>;
                validated_by: z.ZodNullable<z.ZodString>;
                amount: z.ZodNullable<z.ZodNumber>;
                counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, z.ZodTypeAny, "passthrough">>, "many">;
            total: z.ZodNumber;
            page: z.ZodNumber;
            limit: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            page: number;
            limit: number;
            data: z.objectOutputType<{
                id: z.ZodString;
                bond_token_id: z.ZodString;
                from_owner: z.ZodString;
                to_owner: z.ZodString;
                status: z.ZodNativeEnum<{
                    readonly SOLICITADA: "solicitada";
                    readonly ACEPTADA: "aceptada";
                    readonly CONTRAOFERTA: "contraoferta";
                    readonly EN_ESCROW: "en_escrow";
                    readonly PAGO_REGISTRADO: "pago_registrado";
                    readonly PAGO_VALIDADO: "pago_validado";
                    readonly LIBERADA: "liberada";
                    readonly RECHAZADA: "rechazada";
                    readonly CANCELADA: "cancelada";
                }>;
                escrow_contract_id: z.ZodNullable<z.ZodString>;
                payment_evidence_hash: z.ZodNullable<z.ZodString>;
                validated_by: z.ZodNullable<z.ZodString>;
                amount: z.ZodNullable<z.ZodNumber>;
                counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
            total: number;
        }, {
            page: number;
            limit: number;
            data: z.objectInputType<{
                id: z.ZodString;
                bond_token_id: z.ZodString;
                from_owner: z.ZodString;
                to_owner: z.ZodString;
                status: z.ZodNativeEnum<{
                    readonly SOLICITADA: "solicitada";
                    readonly ACEPTADA: "aceptada";
                    readonly CONTRAOFERTA: "contraoferta";
                    readonly EN_ESCROW: "en_escrow";
                    readonly PAGO_REGISTRADO: "pago_registrado";
                    readonly PAGO_VALIDADO: "pago_validado";
                    readonly LIBERADA: "liberada";
                    readonly RECHAZADA: "rechazada";
                    readonly CANCELADA: "cancelada";
                }>;
                escrow_contract_id: z.ZodNullable<z.ZodString>;
                payment_evidence_hash: z.ZodNullable<z.ZodString>;
                validated_by: z.ZodNullable<z.ZodString>;
                amount: z.ZodNullable<z.ZodNumber>;
                counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
                seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, z.ZodTypeAny, "passthrough">[];
            total: number;
        }>;
    };
    readonly 'transfers.create': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            bondTokenId: z.ZodString;
            toOwner: z.ZodOptional<z.ZodString>;
            paymentMethod: z.ZodOptional<z.ZodEnum<["sinpe", "transferencia", "wallet"]>>;
            amount: z.ZodOptional<z.ZodNumber>;
            message: z.ZodOptional<z.ZodString>;
            counterOfferAmount: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            bondTokenId: string;
            message?: string | undefined;
            toOwner?: string | undefined;
            paymentMethod?: "sinpe" | "transferencia" | "wallet" | undefined;
            amount?: number | undefined;
            counterOfferAmount?: number | undefined;
        }, {
            bondTokenId: string;
            message?: string | undefined;
            toOwner?: string | undefined;
            paymentMethod?: "sinpe" | "transferencia" | "wallet" | undefined;
            amount?: number | undefined;
            counterOfferAmount?: number | undefined;
        }>;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.get': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>>;
    };
    readonly 'transfers.accept': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodUnion<[z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>]>;
    };
    readonly 'transfers.reject': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            success: z.ZodLiteral<true>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            success: z.ZodLiteral<true>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.counter': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            amount: z.ZodNumber;
            message: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            amount: number;
            message?: string | undefined;
        }, {
            amount: number;
            message?: string | undefined;
        }>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.acceptCounter': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodUnion<[z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>]>;
    };
    readonly 'transfers.payment': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodEffects<z.ZodObject<{
            evidence: z.ZodOptional<z.ZodString>;
            evidenceContent: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            evidence?: string | undefined;
            evidenceContent?: string | undefined;
        }, {
            evidence?: string | undefined;
            evidenceContent?: string | undefined;
        }>, {
            evidence?: string | undefined;
            evidenceContent?: string | undefined;
        }, {
            evidence?: string | undefined;
            evidenceContent?: string | undefined;
        }>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.validate': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.release': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
            newOwner: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            success: z.ZodLiteral<true>;
            newOwner: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            success: z.ZodLiteral<true>;
            newOwner: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.cancel': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            success: z.ZodLiteral<true>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            success: z.ZodLiteral<true>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.buildXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.submitXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            signedXdr: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            signedXdr: string;
        }, {
            signedXdr: string;
        }>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.instantBuy.buildXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            bondTokenId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            bondTokenId: string;
        }, {
            bondTokenId: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.instantBuy.submitXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            signedXdr: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            signedXdr: string;
        }, {
            signedXdr: string;
        }>;
        params: z.ZodObject<{
            bondTokenId: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            bondTokenId: string;
        }, {
            bondTokenId: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.walletPayment.buildXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.walletPayment.submitXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            signedXdr: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            signedXdr: string;
        }, {
            signedXdr: string;
        }>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.requestReturn': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            reason: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            reason?: string | undefined;
        }, {
            reason?: string | undefined;
        }>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.approveReturn': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            notes: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            notes?: string | undefined;
        }, {
            notes?: string | undefined;
        }>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'transfers.rejectReturn': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            notes: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            notes?: string | undefined;
        }, {
            notes?: string | undefined;
        }>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodNativeEnum<{
                readonly SOLICITADA: "solicitada";
                readonly ACEPTADA: "aceptada";
                readonly CONTRAOFERTA: "contraoferta";
                readonly EN_ESCROW: "en_escrow";
                readonly PAGO_REGISTRADO: "pago_registrado";
                readonly PAGO_VALIDADO: "pago_validado";
                readonly LIBERADA: "liberada";
                readonly RECHAZADA: "rechazada";
                readonly CANCELADA: "cancelada";
            }>;
            escrow_contract_id: z.ZodNullable<z.ZodString>;
            payment_evidence_hash: z.ZodNullable<z.ZodString>;
            validated_by: z.ZodNullable<z.ZodString>;
            amount: z.ZodNullable<z.ZodNumber>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
            seller_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            buyer_message: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_requested_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_approved_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_rejected_by: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            return_tse_notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'reports.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    };
    readonly 'reports.create': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodEffects<z.ZodObject<{
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodOptional<z.ZodString>;
            period_end: z.ZodOptional<z.ZodString>;
            bond_token_ids: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodOptional<z.ZodNumber>;
        }, "strict", z.ZodTypeAny, {
            title: string;
            description: string;
            period_start?: string | undefined;
            period_end?: string | undefined;
            bond_token_ids?: string[] | undefined;
            total_amount?: number | undefined;
        }, {
            title: string;
            description: string;
            period_start?: string | undefined;
            period_end?: string | undefined;
            bond_token_ids?: string[] | undefined;
            total_amount?: number | undefined;
        }>, {
            title: string;
            description: string;
            period_start?: string | undefined;
            period_end?: string | undefined;
            bond_token_ids?: string[] | undefined;
            total_amount?: number | undefined;
        }, {
            title: string;
            description: string;
            period_start?: string | undefined;
            period_end?: string | undefined;
            bond_token_ids?: string[] | undefined;
            total_amount?: number | undefined;
        }>;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'reports.get': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'reports.review': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            status: z.ZodEnum<["revisado", "observado", "aprobado"]>;
            notes: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            status: "aprobado" | "revisado" | "observado";
            notes?: string | undefined;
        }, {
            status: "aprobado" | "revisado" | "observado";
            notes?: string | undefined;
        }>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString, "many">>;
            total_amount: z.ZodNullable<z.ZodNumber>;
            status: z.ZodEnum<["enviado", "revisado", "observado", "aprobado"]>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'notifications.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
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
    };
    readonly 'notifications.readAll': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            ok: z.ZodLiteral<true>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            ok: z.ZodLiteral<true>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            ok: z.ZodLiteral<true>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'notifications.read': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            ok: z.ZodLiteral<true>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            ok: z.ZodLiteral<true>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            ok: z.ZodLiteral<true>;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'users.me': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'users.updateMe': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodEffects<z.ZodObject<{
            full_name: z.ZodOptional<z.ZodString>;
        }, "strict", z.ZodTypeAny, {
            full_name?: string | undefined;
        }, {
            full_name?: string | undefined;
        }>, {
            full_name?: string | undefined;
        }, {
            full_name?: string | undefined;
        }>;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'users.updateWallet': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            publicKey: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            publicKey: string;
        }, {
            publicKey: string;
        }>;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            ok: z.ZodLiteral<true>;
            stellar_public_key: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            ok: z.ZodLiteral<true>;
            stellar_public_key: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            ok: z.ZodLiteral<true>;
            stellar_public_key: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
    readonly 'users.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    };
    readonly 'users.recipients': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            full_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            full_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            full_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
        }, z.ZodTypeAny, "passthrough">>, "many">;
    };
    readonly 'users.setRole': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
        }, "strict", z.ZodTypeAny, {
            role: "tse" | "emisor" | "comprador" | "recomprador" | "validador" | "admin";
        }, {
            role: "tse" | "emisor" | "comprador" | "recomprador" | "validador" | "admin";
        }>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            id: string;
        }, {
            id: string;
        }>;
        query: z.ZodObject<{}, "strict", z.ZodTypeAny, {}, {}>;
        response: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodNativeEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
            party_id: z.ZodNullable<z.ZodString>;
            stellar_wallet: z.ZodNullable<z.ZodString>;
            stellar_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.ZodTypeAny, "passthrough">>;
    };
};
export type EndpointName = keyof typeof apiContracts;
export type EndpointContract = (typeof apiContracts)[EndpointName];
export type ContractInput<K extends EndpointName> = {
    body?: z.input<(typeof apiContracts)[K]['body']>;
    params?: z.input<(typeof apiContracts)[K]['params']>;
    query?: z.input<(typeof apiContracts)[K]['query']>;
};
export type ContractResponse<K extends EndpointName> = z.output<(typeof apiContracts)[K]['response']>;
export interface MatchedContract<K extends EndpointName = EndpointName> {
    name: K;
    contract: (typeof apiContracts)[K];
    params: Record<string, string>;
}
export declare function findContract(method: string, path: string): MatchedContract | null;
export declare function buildContractPath<K extends EndpointName>(name: K, params?: Record<string, string>): string;
