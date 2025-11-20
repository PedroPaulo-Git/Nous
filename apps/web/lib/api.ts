import { createClient } from '@/lib/supabase-client';

/**
 * Get the current user's JWT access token
 * @returns The JWT token or empty string if not authenticated
 */
export async function getToken(): Promise<string> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token || '';
}

/**
 * Base URL for API requests
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Create authorization headers with JWT token
 */
export async function createAuthHeaders(): Promise<HeadersInit> {
  const token = await getToken();
  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Create JSON + authorization headers
 */
export async function createJsonAuthHeaders(): Promise<HeadersInit> {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
