import type { APIRoute } from "astro";
import { getSession } from "../../../../../../../../lib/auth";
import { getCourseBySlug, getCreatorByUserId, updateContentBlock, deleteContentBlock } from "../../../../../../../../lib/db/lms-queries";

export const PATCH: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, blockId } = params;
  if (!slug || !blockId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  if (body.content && typeof body.content !== 'string') body.content = JSON.stringify(body.content);
  await updateContentBlock(blockId, body);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, blockId } = params;
  if (!slug || !blockId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  await deleteContentBlock(blockId);
  return new Response(JSON.stringify({ success: true }), { headers: { "Content-Type": "application/json" } });
};
