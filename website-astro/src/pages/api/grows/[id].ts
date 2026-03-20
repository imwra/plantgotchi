import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import { getGrow, updateGrow } from "../../../lib/db/lifecycle-queries";
import { captureServerEvent } from "../../../lib/posthog";
import { ServerAnalytics } from "../../../lib/analytics.server";

export const GET: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const grow = await getGrow(params.id!);
    if (!grow || grow.user_id !== session.user.id) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(grow), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const userId = session.user.id ?? 'anonymous';
    ServerAnalytics.captureException(userId, error instanceof Error ? error : new Error(String(error)), { endpoint: '/api/grows/[id]', method: 'GET' });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ params, request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  try {
    const grow = await getGrow(params.id!);
    if (!grow || grow.user_id !== session.user.id) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { name, environment, end_date, notes, status } = body;

    await updateGrow(params.id!, { name, environment, end_date, notes, status });

    const updated = await getGrow(params.id!);

    captureServerEvent(session.user.id, 'grow_updated', {
      grow_id: params.id!,
    });

    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const userId = session.user.id ?? 'anonymous';
    ServerAnalytics.captureException(userId, error instanceof Error ? error : new Error(String(error)), { endpoint: '/api/grows/[id]', method: 'PUT' });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
