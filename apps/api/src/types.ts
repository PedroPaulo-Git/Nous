export type JwtUser = {
  id: string;
  email?: string;
};

export type Profile = {
  id: string;
  is_subscribed: boolean;
  is_admin: boolean;
  created_at?: string;
};

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtUser;
    profile?: Profile;
  }
}
