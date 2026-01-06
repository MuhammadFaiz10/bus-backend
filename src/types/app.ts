import { PrismaClient } from '@prisma/client'
import { Bindings } from '../config/database'

export type AppBindings = Bindings

export type AppVariables = {
  prisma: PrismaClient
  user?: any // For auth middleware
}

export type HonoEnv = {
  Bindings: AppBindings
  Variables: AppVariables
}
