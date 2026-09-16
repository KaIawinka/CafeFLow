import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Prisma migrations need a direct Neon connection for advisory locks.
    // Runtime queries continue using the pooled DATABASE_URL.
    url: process.env.DIRECT_URL || env('DATABASE_URL'),
  },
})
