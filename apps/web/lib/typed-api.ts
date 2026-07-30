import { createTypedApiClient } from './contract-client';

export const typedApi = createTypedApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api',
  getRetries: 8,
});
