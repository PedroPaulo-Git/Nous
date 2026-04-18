import { cookies } from 'next/headers';
import { API_URL } from './config';

export async function createClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get('nous_session')?.value ?? '';

  return {
    auth: {
      async getUser() {
        if (!token) return { data: { user: null }, error: null };
        const response = await fetch(`${API_URL}/profiles/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });

        if (!response.ok) return { data: { user: null }, error: null };
        const payload = await response.json();
        return { data: { user: payload.user ?? null }, error: null };
      },
    },
    from(table: string) {
      return {
        select(_columns?: string) {
          const state = {
            filters: new Map<string, string>(),
          };

          const builder = {
            eq(column: string, value: string) {
              state.filters.set(column, value);
              return builder;
            },
            async maybeSingle() {
              return fetchServerTable(token, table, state.filters);
            },
            async single() {
              return fetchServerTable(token, table, state.filters);
            },
          };

          return builder;
        },
      };
    },
  };
}

async function fetchServerTable(token: string, table: string, filters: Map<string, string>) {
  if (!token) return { data: null, error: null };

  if (table === 'profiles') {
    const response = await fetch(`${API_URL}/profiles/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    if (!response.ok) return { data: null, error: null };

    const payload = await response.json();
    const profile = payload.profile ?? null;
    const requestedId = filters.get('id');
    if (requestedId && profile?.id !== requestedId) return { data: null, error: null };
    return { data: profile, error: null };
  }

  if (table === 'instruments') {
    return { data: [], error: null };
  }

  return { data: null, error: null };
}
