import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { D1Database } from '@cloudflare/workers-types'

export type Bindings = {
  DB: D1Database
  JWT_PRIVATE_KEY: string
  MIDTRANS_SERVER_KEY: string
  MIDTRANS_CLIENT_KEY: string
  MIDTRANS_IS_PRODUCTION: string
}

export const getPrisma = (env: Bindings) => {
  const adapter = new PrismaD1(env.DB)
  return new PrismaClient({ adapter })
}
