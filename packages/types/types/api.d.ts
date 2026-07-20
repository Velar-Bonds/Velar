export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}
export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
}
/** Structured error response shared by the API and web client. */
export type ApiError = import('./errors').ApiErrorResponse;
export interface BondSearchQuery {
    tokenId?: string;
    bondId?: string;
    issuerPartyId?: string;
    ownerId?: string;
    status?: string;
}
