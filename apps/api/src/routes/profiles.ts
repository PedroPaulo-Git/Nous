import type { FastifyInstance } from 'fastify';

export async function profilesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', app.authRequired);

  app.get('/me', async (req) => {
    return { user: req.user, profile: req.profile };
  });
}
