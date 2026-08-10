import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import Discord from 'next-auth/providers/discord';

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
    Discord({
      clientId: process.env.AUTH_DISCORD_ID,
      clientSecret: process.env.AUTH_DISCORD_SECRET,
    }),
  ],
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'database',
  },
  callbacks: {
    async session({ session, user }) {
      session.user = {
        id: user.id,
        role: (user.role as 'USER' | 'MOD' | 'ADMIN' | undefined) ?? 'USER',
        username: user.username ?? user.name ?? 'user',
        name: user.name ?? user.username ?? null,
        email: user.email ?? session.user?.email ?? null,
        image: user.image ?? null,
        emailVerified: null,
      };
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow redirect to any page on the same origin
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
} satisfies NextAuthConfig;
