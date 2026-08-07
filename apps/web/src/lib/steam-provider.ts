import type { OAuthConfig } from 'next-auth/providers';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Steam uses OpenID 2.0 (Steam Community login). We wrap it as a custom
 * OAuth provider: the authorization redirect sends OpenID params, the callback
 * carries `openid.claimed_id` from which we extract the 64-bit Steam ID, and we
 * use that as a fake access token before enriching the profile via the
 * ISteamUser API.
 */
export function SteamProvider(): OAuthConfig<{
  id: string;
  username: string;
  name: string;
  image: string;
}> {
  const apiKey = process.env.STEAM_API_KEY || process.env.AUTH_STEAM_API_KEY || '';
  // Steam has no OAuth2 token/userinfo endpoints; these URLs exist only to
  // satisfy Auth.js endpoint assertions. The real profile is resolved from the
  // OpenID 2.0 callback params via `userinfo.request` + `profile()`.
  const openIdEndpoint = 'https://steamcommunity.com/openid/login';
  return {
    id: 'steam',
    name: 'Steam',
    type: 'oauth',
    clientId: 'steam',
    clientSecret: 'steam',
    checks: [],
    authorization: {
      url: openIdEndpoint,
      params: {
        'openid.ns': 'http://specs.openid.net/auth/2.0',
        'openid.mode': 'checkid_setup',
        'openid.return_to': `${BASE_URL}/api/auth/callback/steam`,
        'openid.realm': BASE_URL,
        'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
        'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
      },
    },
    token: { url: openIdEndpoint },
    userinfo: {
      url: openIdEndpoint,
      async request({ tokens }: { tokens: { access_token?: string } }) {
        const steamId = tokens?.access_token ?? '';
        return { id: steamId };
      },
    },
    async profile(profile, tokens) {
      const steamId = (profile as { id?: string })?.id ?? (tokens as { access_token?: string })?.access_token ?? '';
      if (!steamId) throw new Error('Could not resolve Steam account');
      if (!apiKey) throw new Error('Steam API key is not configured on the server');
      const res = await fetch(
        `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`,
        { next: { revalidate: 60 } }
      );
      const data = (await res.json()) as {
        response?: { players?: Array<{ personaname?: string; avatarfull?: string }> };
      };
      const player = data?.response?.players?.[0];
      if (!player) throw new Error('Steam profile not found');
      return {
        id: steamId,
        username: player.personaname ?? `steam_${steamId.slice(-6)}`,
        name: player.personaname ?? `steam_${steamId.slice(-6)}`,
        image: player.avatarfull ?? null,
      };
    },
  };
}
