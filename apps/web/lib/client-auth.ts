import { API_URL } from './config';

type AuthUser = {
  id: string;
  email?: string;
  aud: string;
  role: string;
};

type AuthResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
};

type ApiErrorPayload = {
  statusCode?: number;
  code?: string;
  error?: string;
  message?: string;
};

type AuthClientError = {
  statusCode: number;
  code: string;
  message: string;
};

function setSessionCookie(token: string, expiresIn: number) {
  document.cookie = `nous_session=${encodeURIComponent(token)}; Path=/; Max-Age=${expiresIn}; SameSite=Lax`;
}

function clearSessionCookie() {
  document.cookie = 'nous_session=; Path=/; Max-Age=0; SameSite=Lax';
}

function readSessionCookie() {
  const match = document.cookie.match(/(?:^|; )nous_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return atob(normalized + padding);
}

function decodeToken(token: string): AuthUser | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    return {
      id: payload.sub,
      email: payload.email,
      aud: 'authenticated',
      role: 'authenticated',
    };
  } catch {
    return null;
  }
}

function buildAuthClientError(path: string, status: number, payload: ApiErrorPayload | null): AuthClientError {
  const fallbackMessage =
    path === 'login'
      ? 'Unable to complete login right now. Please try again later.'
      : 'Unable to create account right now. Please try again later.';

  return {
    statusCode: payload?.statusCode ?? status,
    code: payload?.code ?? 'AUTH_REQUEST_FAILED',
    message: payload?.message ?? fallbackMessage,
  };
}

async function requestAuth(path: string, body: { email: string; password: string }) {
  const response = await fetch(`${API_URL}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      data: { user: null, session: null },
      error: buildAuthClientError(path, response.status, payload),
    };
  }

  const auth = payload as AuthResponse;
  setSessionCookie(auth.access_token, auth.expires_in);

  return {
    data: {
      user: auth.user,
      session: {
        access_token: auth.access_token,
      },
    },
    error: null,
  };
}

async function fetchProfile(table: string, filters: Map<string, string>) {
  if (table !== 'profiles') {
    return { data: null, error: null };
  }

  const token = readSessionCookie();
  if (!token) return { data: null, error: null };

  const response = await fetch(`${API_URL}/profiles/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    return { data: null, error: { message: 'Failed to load profile' } };
  }

  const payload = await response.json();
  const profile = payload?.profile ?? null;
  const requestedId = filters.get('id');
  if (requestedId && profile?.id !== requestedId) {
    return { data: null, error: null };
  }

  return { data: profile, error: null };
}

export function createLocalAuthClient() {
  return {
    auth: {
      async signInWithPassword(credentials: { email: string; password: string }) {
        return requestAuth('login', credentials);
      },
      async signUp(credentials: { email: string; password: string }) {
        return requestAuth('register', credentials);
      },
      async signOut() {
        clearSessionCookie();
        return { error: null };
      },
      async getUser() {
        return {
          data: { user: decodeToken(readSessionCookie()) },
          error: null,
        };
      },
      async getSession() {
        const token = readSessionCookie();
        return {
          data: {
            session: token
              ? {
                  access_token: token,
                }
              : null,
          },
          error: null,
        };
      },
    },
    from(table: string) {
      return {
        select(_columns?: string) {
          const state = {
            table,
            filters: new Map<string, string>(),
          };

          const builder = {
            eq(column: string, value: string) {
              state.filters.set(column, value);
              return builder;
            },
            async maybeSingle() {
              return fetchProfile(table, state.filters);
            },
            async single() {
              return fetchProfile(table, state.filters);
            },
          };

          return builder;
        },
      };
    },
  };
}
