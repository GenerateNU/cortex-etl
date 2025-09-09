import NextAuth from 'next-auth' // eslint-disable-line

declare module 'next-auth' {
  interface User {
    role?: string
    tenantId?: string
  }

  interface Session {
    user: {
      role?: string
      tenantId?: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    tenantId?: string
  }
}
