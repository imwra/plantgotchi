import type { APIRoute } from "astro";
import { auth } from "../../../lib/auth";

export const ALL: APIRoute = async ({ request }) => {
  try {
    return auth.handler(request);
  } catch (e: any) {
    return new Response(JSON.stringify({
      error: e.message,
      stack: e.stack?.substring(0, 1000),
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
