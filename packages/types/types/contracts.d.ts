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
        body: z.ZodObject<{
            email: z.ZodString;
            password: z.ZodString;
            perspectiva: z.ZodEnum<{
                usuario: "usuario";
                partido: "partido";
            }>;
            nombres: z.ZodOptional<z.ZodString>;
            apellidos: z.ZodOptional<z.ZodString>;
            identificacion: z.ZodOptional<z.ZodString>;
            telefono: z.ZodOptional<z.ZodString>;
            direccion: z.ZodOptional<z.ZodString>;
            nombrePartido: z.ZodOptional<z.ZodString>;
            codigo: z.ZodOptional<z.ZodString>;
            representanteLegal: z.ZodOptional<z.ZodString>;
            cedulaJuridica: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            role: z.ZodEnum<{
                emisor: "emisor";
                comprador: "comprador";
            }>;
            perspectiva: z.ZodEnum<{
                usuario: "usuario";
                partido: "partido";
            }>;
            partyId: z.ZodNullable<z.ZodString>;
            wallet: z.ZodNullable<z.ZodString>;
        }, z.core.$loose>;
    };
    readonly 'auth.login': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            email: z.ZodString;
            password: z.ZodString;
        }, z.core.$strict>;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            access_token: z.ZodString;
            refresh_token: z.ZodString;
            expires_in: z.ZodNumber;
            token_type: z.ZodString;
            user: z.ZodUnknown;
        }, z.core.$loose>;
    };
    readonly 'bonds.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{
            page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            country: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
        response: z.ZodObject<{
            data: z.ZodArray<z.ZodObject<{
                token_id: z.ZodString;
                bond_id: z.ZodString;
                issuer_party_id: z.ZodString;
                current_owner: z.ZodNullable<z.ZodString>;
                status: z.ZodEnum<{
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
                face_value: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
                certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                currency: z.ZodOptional<z.ZodString>;
                interest_rate: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
                series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                country: z.ZodOptional<z.ZodString>;
                payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                    sinpe: "sinpe";
                    transferencia: "transferencia";
                    wallet: "wallet";
                }>>>;
                stellar_status: z.ZodOptional<z.ZodString>;
                stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
                stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
                created_at: z.ZodString;
                updated_at: z.ZodString;
            }, z.core.$loose>>;
            total: z.ZodNumber;
            page: z.ZodNumber;
            limit: z.ZodNumber;
        }, z.core.$strip>;
    };
    readonly 'bonds.requests.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            requested_by: z.ZodString;
            status: z.ZodEnum<{
                pendiente: "pendiente";
                aprobado: "aprobado";
                rechazado: "rechazado";
            }>;
            face_value: z.ZodCoercedNumber<unknown>;
            currency: z.ZodString;
            interest_rate: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            issue_date: z.ZodNullable<z.ZodString>;
            maturity_date: z.ZodNullable<z.ZodString>;
            bond_token_id: z.ZodNullable<z.ZodString>;
            rejection_reason: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>>;
    };
    readonly 'bonds.requests.create': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            faceValue: z.ZodCoercedNumber<unknown>;
            currency: z.ZodOptional<z.ZodString>;
            interestRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            series: z.ZodOptional<z.ZodString>;
            issueDate: z.ZodOptional<z.ZodString>;
            maturityDate: z.ZodOptional<z.ZodString>;
            notes: z.ZodOptional<z.ZodString>;
            certificateNumber: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            requested_by: z.ZodString;
            status: z.ZodEnum<{
                pendiente: "pendiente";
                aprobado: "aprobado";
                rechazado: "rechazado";
            }>;
            face_value: z.ZodCoercedNumber<unknown>;
            currency: z.ZodString;
            interest_rate: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            issue_date: z.ZodNullable<z.ZodString>;
            maturity_date: z.ZodNullable<z.ZodString>;
            bond_token_id: z.ZodNullable<z.ZodString>;
            rejection_reason: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'bonds.requests.approve': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<{
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
            face_value: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                sinpe: "sinpe";
                transferencia: "transferencia";
                wallet: "wallet";
            }>>>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'bonds.requests.reject': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            reason: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            ok: z.ZodLiteral<true>;
        }, z.core.$loose>;
    };
    readonly 'bonds.available': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{
            country: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
        response: z.ZodArray<z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<{
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
            face_value: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                sinpe: "sinpe";
                transferencia: "transferencia";
                wallet: "wallet";
            }>>>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>>;
    };
    readonly 'bonds.create': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            bondId: z.ZodString;
            issuerPartyId: z.ZodString;
            documentHash: z.ZodString;
            metadataUri: z.ZodOptional<z.ZodString>;
            faceValue: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            initialOwner: z.ZodOptional<z.ZodString>;
            certificateNumber: z.ZodOptional<z.ZodString>;
            currency: z.ZodOptional<z.ZodString>;
            interestRate: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            series: z.ZodOptional<z.ZodString>;
            issueDate: z.ZodOptional<z.ZodString>;
            maturityDate: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<{
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
            face_value: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                sinpe: "sinpe";
                transferencia: "transferencia";
                wallet: "wallet";
            }>>>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'bonds.get': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<{
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
            face_value: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                sinpe: "sinpe";
                transferencia: "transferencia";
                wallet: "wallet";
            }>>>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'bonds.onchain': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            enabled: z.ZodBoolean;
        }, z.core.$loose>;
    };
    readonly 'bonds.issueOnchain': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            ok: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
            alreadyIssued: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$loose>;
    };
    readonly 'bonds.publish': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            paymentMethods: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                sinpe: "sinpe";
                transferencia: "transferencia";
                wallet: "wallet";
            }>>>;
        }, z.core.$strict>;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<{
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
            face_value: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                sinpe: "sinpe";
                transferencia: "transferencia";
                wallet: "wallet";
            }>>>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'bonds.sorobanDetails': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            source: z.ZodEnum<{
                soroban: "soroban";
                database_snapshot: "database_snapshot";
            }>;
            contract_id: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'bonds.freeze': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<{
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
            face_value: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                sinpe: "sinpe";
                transferencia: "transferencia";
                wallet: "wallet";
            }>>>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'bonds.unfreeze': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            token_id: z.ZodString;
            bond_id: z.ZodString;
            issuer_party_id: z.ZodString;
            current_owner: z.ZodNullable<z.ZodString>;
            status: z.ZodEnum<{
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
            face_value: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            certificate_number: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            currency: z.ZodOptional<z.ZodString>;
            interest_rate: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            series: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            issue_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            maturity_date: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            country: z.ZodOptional<z.ZodString>;
            payment_methods: z.ZodOptional<z.ZodArray<z.ZodEnum<{
                sinpe: "sinpe";
                transferencia: "transferencia";
                wallet: "wallet";
            }>>>;
            stellar_status: z.ZodOptional<z.ZodString>;
            stellar_transaction_hash: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_ledger: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
            stellar_asset_code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_issuer_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_owner_public_key: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_registered_at: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            stellar_error: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'bonds.uploadDocument': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUnknown;
        params: z.ZodObject<{
            tokenId: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            documentHash: z.ZodString;
            sorobanTxHash: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    };
    readonly 'bonds.hash': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            content: z.ZodString;
        }, z.core.$strict>;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            hash: z.ZodString;
        }, z.core.$strip>;
    };
    readonly 'transfers.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{
            page: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            limit: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        }, z.core.$loose>;
        response: z.ZodObject<{
            data: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                bond_token_id: z.ZodString;
                from_owner: z.ZodString;
                to_owner: z.ZodString;
                status: z.ZodEnum<{
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
                amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
                counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
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
            }, z.core.$loose>>;
            total: z.ZodNumber;
            page: z.ZodNumber;
            limit: z.ZodNumber;
        }, z.core.$strip>;
    };
    readonly 'transfers.create': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            bondTokenId: z.ZodString;
            toOwner: z.ZodOptional<z.ZodString>;
            paymentMethod: z.ZodOptional<z.ZodEnum<{
                sinpe: "sinpe";
                transferencia: "transferencia";
                wallet: "wallet";
            }>>;
            amount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
            message: z.ZodOptional<z.ZodString>;
            counterOfferAmount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        }, z.core.$strict>;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodEnum<{
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
            amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
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
        }, z.core.$loose>;
    };
    readonly 'transfers.get': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodNullable<z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodEnum<{
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
            amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
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
        }, z.core.$loose>>;
    };
    readonly 'transfers.accept': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodUnion<readonly [z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodEnum<{
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
            amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
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
        }, z.core.$loose>, z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>]>;
    };
    readonly 'transfers.reject': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
        }, z.core.$loose>;
    };
    readonly 'transfers.counter': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            amount: z.ZodCoercedNumber<unknown>;
            message: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodEnum<{
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
            amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
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
        }, z.core.$loose>;
    };
    readonly 'transfers.acceptCounter': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodUnion<readonly [z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodEnum<{
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
            amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
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
        }, z.core.$loose>, z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>]>;
    };
    readonly 'transfers.payment': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            evidence: z.ZodOptional<z.ZodString>;
            evidenceContent: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodEnum<{
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
            amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
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
        }, z.core.$loose>;
    };
    readonly 'transfers.validate': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodEnum<{
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
            amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
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
        }, z.core.$loose>;
    };
    readonly 'transfers.release': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
            newOwner: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'transfers.cancel': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
        }, z.core.$loose>;
    };
    readonly 'transfers.buildXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'transfers.submitXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            signedXdr: z.ZodString;
        }, z.core.$strict>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    };
    readonly 'transfers.instantBuy.buildXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            bondTokenId: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'transfers.instantBuy.submitXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            signedXdr: z.ZodString;
        }, z.core.$strict>;
        params: z.ZodObject<{
            bondTokenId: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    };
    readonly 'transfers.walletPayment.buildXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            xdr: z.ZodString;
            networkPassphrase: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'transfers.walletPayment.submitXdr': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            signedXdr: z.ZodString;
        }, z.core.$strict>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    };
    readonly 'transfers.requestReturn': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            reason: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodEnum<{
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
            amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
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
        }, z.core.$loose>;
    };
    readonly 'transfers.approveReturn': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            notes: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            success: z.ZodLiteral<true>;
            txHash: z.ZodOptional<z.ZodString>;
        }, z.core.$loose>;
    };
    readonly 'transfers.rejectReturn': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            notes: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            bond_token_id: z.ZodString;
            from_owner: z.ZodString;
            to_owner: z.ZodString;
            status: z.ZodEnum<{
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
            amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            counter_offer_amount: z.ZodOptional<z.ZodNullable<z.ZodCoercedNumber<unknown>>>;
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
        }, z.core.$loose>;
    };
    readonly 'reports.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString>>;
            total_amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            status: z.ZodEnum<{
                aprobado: "aprobado";
                enviado: "enviado";
                revisado: "revisado";
                observado: "observado";
            }>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>>;
    };
    readonly 'reports.create': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodOptional<z.ZodString>;
            period_end: z.ZodOptional<z.ZodString>;
            bond_token_ids: z.ZodOptional<z.ZodArray<z.ZodString>>;
            total_amount: z.ZodOptional<z.ZodCoercedNumber<unknown>>;
        }, z.core.$strict>;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString>>;
            total_amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            status: z.ZodEnum<{
                aprobado: "aprobado";
                enviado: "enviado";
                revisado: "revisado";
                observado: "observado";
            }>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'reports.get': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString>>;
            total_amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            status: z.ZodEnum<{
                aprobado: "aprobado";
                enviado: "enviado";
                revisado: "revisado";
                observado: "observado";
            }>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'reports.review': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            status: z.ZodEnum<{
                aprobado: "aprobado";
                revisado: "revisado";
                observado: "observado";
            }>;
            notes: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            party_id: z.ZodString;
            submitted_by: z.ZodString;
            title: z.ZodString;
            description: z.ZodString;
            period_start: z.ZodNullable<z.ZodString>;
            period_end: z.ZodNullable<z.ZodString>;
            bond_token_ids: z.ZodNullable<z.ZodArray<z.ZodString>>;
            total_amount: z.ZodNullable<z.ZodCoercedNumber<unknown>>;
            status: z.ZodEnum<{
                aprobado: "aprobado";
                enviado: "enviado";
                revisado: "revisado";
                observado: "observado";
            }>;
            reviewed_by: z.ZodNullable<z.ZodString>;
            reviewed_at: z.ZodNullable<z.ZodString>;
            tse_notes: z.ZodNullable<z.ZodString>;
            created_at: z.ZodString;
            updated_at: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'notifications.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
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
    };
    readonly 'notifications.readAll': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            ok: z.ZodLiteral<true>;
        }, z.core.$loose>;
    };
    readonly 'notifications.read': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            ok: z.ZodLiteral<true>;
        }, z.core.$loose>;
    };
    readonly 'users.me': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodEnum<{
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
        }, z.core.$loose>;
    };
    readonly 'users.updateMe': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            full_name: z.ZodOptional<z.ZodString>;
        }, z.core.$strict>;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodEnum<{
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
        }, z.core.$loose>;
    };
    readonly 'users.updateWallet': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            publicKey: z.ZodString;
        }, z.core.$strict>;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            ok: z.ZodLiteral<true>;
            stellar_public_key: z.ZodString;
        }, z.core.$loose>;
    };
    readonly 'users.list': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodEnum<{
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
        }, z.core.$loose>>;
    };
    readonly 'users.recipients': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodUndefined;
        params: z.ZodObject<{}, z.core.$strict>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            full_name: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            email: z.ZodOptional<z.ZodNullable<z.ZodString>>;
            role: z.ZodEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
        }, z.core.$loose>>;
    };
    readonly 'users.setRole': {
        method: HttpMethod;
        path: string;
        module: "auth" | "bonds" | "transfers" | "reports" | "escrow" | "notifications" | "users";
        auth: boolean;
        body: z.ZodObject<{
            role: z.ZodEnum<{
                readonly TSE: "tse";
                readonly EMISOR: "emisor";
                readonly COMPRADOR: "comprador";
                readonly RECOMPRADOR: "recomprador";
                readonly VALIDADOR: "validador";
                readonly ADMIN: "admin";
            }>;
        }, z.core.$strict>;
        params: z.ZodObject<{
            id: z.ZodString;
        }, z.core.$strip>;
        query: z.ZodObject<{}, z.core.$strict>;
        response: z.ZodObject<{
            id: z.ZodString;
            email: z.ZodString;
            full_name: z.ZodNullable<z.ZodString>;
            role: z.ZodEnum<{
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
        }, z.core.$loose>;
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
