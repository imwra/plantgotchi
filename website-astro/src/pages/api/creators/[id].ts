import type { APIRoute } from "astro";
import { getCreatorById } from "../../../lib/db/lms-queries";

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;
  if (!id) return new Response("Not found", { status: 404 });

  const creator = await getCreatorById(id);
  if (!creator) return new Response("Not found", { status: 404 });

  return new Response(JSON.stringify(creator), { headers: { "Content-Type": "application/json" } });
};
