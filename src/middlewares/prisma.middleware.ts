import { Context, Next } from 'hono'
import { getPrisma } from '../config/database'
import { HonoEnv } from '../types/app'

export const prismaMiddleware = async (c: Context<HonoEnv>, next: Next) => {
  const prisma = getPrisma(c.env)
  c.set('prisma', prisma)
  await next()
}
