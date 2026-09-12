/**
 * Prisma Client Instance
 * Singleton pattern to avoid multiple instances in development
 */

import { PrismaClient } from '@prisma/client';

// Fallback DATABASE_URL for build time (never used at runtime)
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/db?schema=public';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
