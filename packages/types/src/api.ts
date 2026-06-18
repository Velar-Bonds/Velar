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

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface BondSearchQuery {
  tokenId?: string;
  bondId?: string;
  issuerPartyId?: string;
  ownerId?: string;
  status?: string;
}
