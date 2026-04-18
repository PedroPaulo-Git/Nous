import { createHmac, timingSafeEqual } from 'node:crypto';

type JwtPayload = Record<string, unknown> & {
  sub: string;
  email: string;
  exp: number;
  iat: number;
};

function base64UrlEncode(input: string | Buffer) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64').toString('utf8');
}

export function signJwt(
  payload: Pick<JwtPayload, 'sub' | 'email'> & Record<string, unknown>,
  secret: string,
  expiresInSeconds: number
) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;
  const fullPayload: JwtPayload = { ...payload, iat, exp };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest();

  return `${encodedHeader}.${encodedPayload}.${base64UrlEncode(signature)}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expected = createHmac('sha256', secret).update(`${header}.${payload}`).digest();
  const actual = Buffer.from(
    signature.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (signature.length % 4)) % 4),
    'base64'
  );

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payload)) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now) return null;
    return decoded;
  } catch {
    return null;
  }
}
