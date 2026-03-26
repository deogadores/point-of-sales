import { defineConfig } from 'drizzle-kit'

const isProduction = process.env.TURSO_DATABASE_URL !== undefined

export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db/schema.ts',
  dialect: 'turso',
  dbCredentials: isProduction
    ? {
        url: process.env.TURSO_DATABASE_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN,
      }
    : {
        url: 'file:./pos.db',
      },
})
