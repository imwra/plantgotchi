import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    const tursoUrl = import.meta.env.TURSO_URL || "";
    const hasSecret = !!import.meta.env.BETTER_AUTH_SECRET;

    return new Response(JSON.stringify({
      tursoUrlSet: tursoUrl.length > 0,
      tursoUrlStart: tursoUrl.substring(0, 20),
      authSecretSet: hasSecret,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message, stack: e.stack?.substring(0, 500) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
