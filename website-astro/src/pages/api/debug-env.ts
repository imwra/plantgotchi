import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ locals }) => {
  const runtime = (locals as any).runtime;
  return new Response(JSON.stringify({
    hasTursoUrl: !!import.meta.env.TURSO_URL,
    tursoUrlPrefix: import.meta.env.TURSO_URL?.substring(0, 15) || "NOT_SET",
    hasAuthSecret: !!import.meta.env.BETTER_AUTH_SECRET,
    runtimeEnvKeys: runtime?.env ? Object.keys(runtime.env) : "no_runtime",
    runtimeTursoUrl: runtime?.env?.TURSO_URL?.substring(0, 15) || "NOT_IN_RUNTIME",
  }), {
    headers: { "Content-Type": "application/json" },
  });
};
