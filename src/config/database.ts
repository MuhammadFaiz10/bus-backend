import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'
import { D1Database, Fetcher } from '@cloudflare/workers-types'

export type Bindings = {
  DB: D1Database
  ASSETS: Fetcher
  JWT_PRIVATE_KEY: string
  MIDTRANS_SERVER_KEY: string
  MIDTRANS_CLIENT_KEY: string
  MIDTRANS_IS_PRODUCTION: string
}

export const getPrisma = (env: Bindings) => {
  const adapter = new PrismaD1(env.DB)
  return new PrismaClient({ adapter })
}
