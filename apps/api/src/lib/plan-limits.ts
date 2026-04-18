import type { FastifyInstance, FastifyRequest } from 'fastify';

const FREE_PLAN_ITEM_LIMIT = Number(process.env.FREE_PLAN_ITEM_LIMIT || 10);

const RESOURCE_CONFIG = {
  notes: {
    table: 'notes',
    label: 'notes',
  },
  todos: {
    table: 'todos',
    label: 'todos',
  },
  flashcardDecks: {
    table: 'flashcard_decks',
    label: 'flashcard decks',
  },
  flashcards: {
    table: 'flashcards',
    label: 'flashcards',
  },
  passwords: {
    table: 'passwords',
    label: 'passwords',
  },
} as const;

type ResourceKey = keyof typeof RESOURCE_CONFIG;

export type PlanLimitError = {
  statusCode: 403;
  code: 'FREE_PLAN_LIMIT_REACHED';
  error: 'Forbidden';
  message: string;
  limit: number;
  resource: string;
};

export async function getPlanLimitError(
  app: FastifyInstance,
  request: FastifyRequest,
  resource: ResourceKey
): Promise<PlanLimitError | null> {
  if (request.profile?.is_admin || request.profile?.is_subscribed) {
    return null;
  }

  const config = RESOURCE_CONFIG[resource];
  const { rows } = await app.db.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM public."${config.table}" WHERE user_id = $1`,
    [request.user!.id]
  );

  const currentCount = rows[0]?.count ?? 0;
  if (currentCount < FREE_PLAN_ITEM_LIMIT) {
    return null;
  }

  return {
    statusCode: 403,
    code: 'FREE_PLAN_LIMIT_REACHED',
    error: 'Forbidden',
    message: `Free plan limit reached. You can create up to ${FREE_PLAN_ITEM_LIMIT} ${config.label}. Upgrade to premium to add more.`,
    limit: FREE_PLAN_ITEM_LIMIT,
    resource: resource,
  };
}

export function getFreePlanItemLimit() {
  return FREE_PLAN_ITEM_LIMIT;
}
