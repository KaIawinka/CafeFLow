/**
 * Prisma Client Instance with PostgreSQL adapter
 * Singleton pattern to avoid multiple instances in development
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const isDatabaseUnavailableError = (error: unknown) => {
  if (!error || typeof error !== 'object') return false;

  const prismaError = error as { code?: string; message?: string };
  return prismaError.code === 'P1001' || prismaError.message?.includes('Can\'t reach database server') === true;
};

const normalizeConnectionString = (connectionString: string) => {
  try {
    const url = new URL(connectionString);
    if (url.protocol === 'postgresql:' || url.protocol === 'postgres:') {
      url.searchParams.set('sslmode', 'verify-full');
    }
    return url.toString();
  } catch {
    return connectionString;
  }
};

const createPrismaClient = () => {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const adapter = new PrismaPg(normalizeConnectionString(connectionString));

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'warn'] : ['warn'],
  });
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
