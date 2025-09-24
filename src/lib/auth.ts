import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db/config'
import * as schema from '@/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
    changeEmail: {
      enabled: true,
      requireEmailVerification: false,
    },
    changePassword: {
      enabled: true,
    },
  },
  trustedOrigins: [
    'http://localhost:8081',
    'exp://localhost:8081',
    'http://localhost:19006',
  ],
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
  },
})

export type Session = typeof auth.$Infer.Session
export type User = Session['user']
