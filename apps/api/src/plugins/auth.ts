import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { JwtUser, Profile } from '../types';
import { verifyJwt } from '../lib/jwt.js';

/**
 * Auth plugin: Extracts the Supabase JWT from Authorization header and resolves
 * the user and profile. Usage:
 * - app.addHook('onRequest', app.authOptional) for endpoints that may be public
 * - app.addHook('preHandler', app.authRequired) for endpoints that require auth
 */
export default fp(async function auth(app: FastifyInstance) {
  const jwtSecret = process.env.AUTH_JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('AUTH_JWT_SECRET not set');
  }

  app.decorate(
    'authOptional',
    async (request: FastifyRequest) => {
      const token = extractBearer(request);
      if (!token) return;
      try {
        const payload = verifyJwt(token, jwtSecret);
        if (!payload) return;
        const user: JwtUser = { id: payload.sub, email: payload.email };
        request.user = user;
        const { data: profile, error: pErr } = await app.supabase
          .from('profiles')
          .select('id,is_subscribed,is_admin,created_at')
          .eq('id', user.id)
          .maybeSingle();
        if (!pErr && profile) request.profile = profile as Profile;
      } catch (e) {
        app.log.warn({ err: e }, 'authOptional failed');
      }
    }
  );

  app.decorate(
    'authRequired',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const token = extractBearer(request);
      if (!token) return reply.unauthorized('Missing Authorization');
      const payload = verifyJwt(token, jwtSecret);
      if (!payload) return reply.unauthorized('Invalid token');
      const user: JwtUser = { id: payload.sub, email: payload.email };
      request.user = user;
      const { data: profile, error: pErr } = await app.supabase
        .from('profiles')
        .select('id,is_subscribed,is_admin,created_at')
        .eq('id', user.id)
        .maybeSingle();
      if (pErr || !profile) return reply.forbidden('Profile missing');
      request.profile = profile as Profile;
    }
  );

  app.decorate(
    'adminRequired',
    async (request: FastifyRequest, reply: FastifyReply) => {
      await (app as any).authRequired(request, reply);
      if (!request.profile?.is_admin) return reply.forbidden('Admin only');
    }
  );
});

function extractBearer(request: FastifyRequest): string | null {
  const header = request.headers['authorization'];
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

declare module 'fastify' {
  interface FastifyInstance {
    authOptional: (request: FastifyRequest) => Promise<void>;
    authRequired: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    adminRequired: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
