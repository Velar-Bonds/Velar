import axios from 'axios';
import { createClient } from '../supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function getApiClient() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return axios.create({
    baseURL: API_URL,
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {},
  });
}
