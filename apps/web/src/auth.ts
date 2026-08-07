import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { authConfig } from '@/auth.config';

/**
 * PrismaAdapter returns a standard adapter; we wrap createUser to assign a
 * unique `username` from the OAuth profile with collision-safe retries.
 */
function buildAdapter() {
  const adapter = PrismaAdapter(prisma);

  const originalCreateUser = adapter.createUser?.bind(adapter);
  adapter.createUser = async (user) => {
    const base =
      (user as { username?: string }).username?.trim() ||
      user.name?.trim() ||
      'user';
    const clean =
      base
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '')
        .slice(0, 24) || 'user';

    for (let attempt = 0; attempt < 8; attempt++) {
      const username = attempt === 0 ? clean : `${clean}_${attempt}`;
      try {
        const created = await prisma.user.create({
          data: {
            username,
            email: user.email,
            name: user.name,
            image: user.image,
            emailVerified: user.emailVerified ?? null,
          },
        });
        return created as unknown as Awaited<
          ReturnType<NonNullable<typeof originalCreateUser>>
        >;
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code !== 'P2002') throw err;
        // unique violation on username/email -> try next suffix
      }
    }
    throw new Error('Could not create user account');
  };

  return adapter;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: buildAdapter(),
});
