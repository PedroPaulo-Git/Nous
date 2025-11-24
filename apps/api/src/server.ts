import Fastify from 'fastify';
import core from './plugins/core.js';
import supabasePlugin from './plugins/supabase.js';
import auth from './plugins/auth.js';
import { profilesRoutes } from './routes/profiles.js';
import { notesRoutes } from './routes/notes.js';
import { todosRoutes } from './routes/todos.js';
import { flashcardsRoutes } from './routes/flashcards.js';
import { passwordsRoutes } from './routes/passwords.js';
import { adminRoutes } from './routes/admin.js';
import { workoutsRoutes } from './routes/workouts.js';
import { drinkWaterRoutes } from './routes/drinkwater.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Entry point for the Fastify API server.
 * Routes are mounted under logical prefixes.
 */
async function build() {
  const app = Fastify({ logger: true });

  await app.register(core);
  await app.register(supabasePlugin);
  await app.register(auth);

  app.register(async (instance) => profilesRoutes(instance), { prefix: '/profiles' });
  app.register(async (instance) => notesRoutes(instance), { prefix: '/notes' });
  app.register(async (instance) => todosRoutes(instance), { prefix: '/todos' });
  app.register(async (instance) => flashcardsRoutes(instance), { prefix: '/flashcards' });
  app.register(async (instance) => passwordsRoutes(instance), { prefix: '/passwords' });
  app.register(async (instance) => workoutsRoutes(instance), { prefix: '/workouts' });
  app.register(async (instance) => drinkWaterRoutes(instance), { prefix: '/drinkwater' });
  app.register(async (instance) => adminRoutes(instance), { prefix: '/admin' });

  app.get('/health', async () => ({ ok: true }));

  return app;
}

build()
  .then((app) => {
    const port = Number(process.env.API_PORT || 4000);
    const host = process.env.API_HOST || '0.0.0.0';
    app.listen({ port, host }).catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', err);
    process.exit(1);
  });
