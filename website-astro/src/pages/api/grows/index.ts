import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import { getGrows, getActiveGrows, createGrow } from "../../../lib/db/lifecycle-queries";
import { captureServerEvent } from "../../../lib/posthog";
import { ServerAnalytics } from "../../../lib/analytics.server";

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const url = new URL(request.url);
    const activeOnly = url.searchParams.get('active') === 'true';
    const grows = activeOnly
      ? await getActiveGrows(session.user.id)
      : await getGrows(session.user.id);

    return new Response(JSON.stringify(grows), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const userId = session.user.id ?? 'anonymous';
    ServerAnalytics.captureException(userId, error instanceof Error ? error : new Error(String(error)), { endpoint: '/api/grows', method: 'GET' });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const body = await request.json();
    const { name, environment, start_date, notes } = body;

    if (!name) {
      return new Response(JSON.stringify({ error: "Name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();
    const grow = {
      id: crypto.randomUUID(),
      user_id: session.user.id,
      name,
      environment: environment ?? null,
      start_date: start_date ?? now,
      end_date: null,
      notes: notes ?? null,
      status: 'active' as const,
    };

    await createGrow(grow);

    captureServerEvent(session.user.id, 'grow_created', {
      grow_id: grow.id,
    });

    return new Response(JSON.stringify({ ...grow, created_at: now, updated_at: now }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const userId = session.user.id ?? 'anonymous';
    ServerAnalytics.captureException(userId, error instanceof Error ? error : new Error(String(error)), { endpoint: '/api/grows', method: 'POST' });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
