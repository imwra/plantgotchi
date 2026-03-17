import type { APIRoute } from "astro";
import { getSession } from "../../../../../../../../lib/auth";
import { getCourseBySlug, getCreatorByUserId, listContentBlocks, createContentBlock } from "../../../../../../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ params }) => {
  const { moduleId } = params;
  if (!moduleId) return new Response("Not found", { status: 404 });

  const blocks = await listContentBlocks(moduleId);
  return new Response(JSON.stringify(blocks), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { slug, moduleId } = params;
  if (!slug || !moduleId) return new Response("Not found", { status: 404 });

  const course = await getCourseBySlug(slug);
  if (!course) return new Response("Not found", { status: 404 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator || creator.id !== course.creator_id) {
    return new Response(JSON.stringify({ error: "Not authorized" }), { status: 403, headers: { "Content-Type": "application/json" } });
  }

  const body = await request.json();
  if (!body.block_type || !body.content) {
    return new Response(JSON.stringify({ error: "block_type and content are required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const block = await createContentBlock(moduleId, body.block_type, typeof body.content === 'string' ? body.content : JSON.stringify(body.content));
  return new Response(JSON.stringify(block), { status: 201, headers: { "Content-Type": "application/json" } });
};
