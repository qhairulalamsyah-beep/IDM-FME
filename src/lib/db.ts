import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { resolve } from 'path'

// Explicitly load .env.local with override to handle system-level env vars
// (e.g., container environment may set DATABASE_URL to a SQLite path)
const envLocalPath = resolve(process.cwd(), '.env.local')
config({ path: envLocalPath, override: true })
config({ path: resolve(process.cwd(), '.env'), override: true })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
