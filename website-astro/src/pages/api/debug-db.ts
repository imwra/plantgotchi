import type { APIRoute } from "astro";

export const GET: APIRoute = async () => {
  try {
    // Import dynamically to catch module-level errors
    const { getDb } = await import("../../lib/db/client");
    const db = getDb();
    const result = await db.execute("SELECT 1 as test");
    return new Response(JSON.stringify({
      connected: true,
      result: result.rows,
    }), {
      headers: { "Content-Type": "application/json" },
    });
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
