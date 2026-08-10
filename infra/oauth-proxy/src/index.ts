interface Env {
  OAUTH_KV: KVNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Health check
    if (url.pathname === '/health') {
      const target = await env.OAUTH_KV.get('target-url');
      return new Response(JSON.stringify({ status: 'ok', target }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Read current target URL from KV
    const targetUrl = await env.OAUTH_KV.get('target-url');
    if (!targetUrl) {
      return new Response('OAuth proxy not configured. Set target-url in KV.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Build redirect URL: preserve path + query params, change origin
    const redirectUrl = new URL(url.pathname + url.search, targetUrl);

    // 302 redirect — preserves method, allows browser to follow
    return new Response(null, {
      status: 302,
      headers: { Location: redirectUrl.toString() },
    });
  },
};
