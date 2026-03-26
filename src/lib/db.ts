import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './db/schema'

const isProduction = !!process.env.TURSO_DATABASE_URL

const client = createClient(
  isProduction
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: process.env.DATABASE_URL ?? 'file:./pos.db',
      }
)

export const db = drizzle(client, { schema })
