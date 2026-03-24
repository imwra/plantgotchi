import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";
import { getCreatorByUserId, listCreatorCourses, createCourse, searchCourses } from "../../../lib/db/lms-queries";
import { ServerAnalytics } from "../../../lib/analytics.server";

export const GET: APIRoute = async ({ request, url }) => {
  const session = await getSession(request);
  const mine = url.searchParams.get("mine") === "true";
  const limit = Number(url.searchParams.get("limit") || 50);
  const offset = Number(url.searchParams.get("offset") || 0);

  if (mine) {
    if (!session) return new Response("Unauthorized", { status: 401 });
    const creator = await getCreatorByUserId(session.user.id);
    if (!creator) return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    const courses = await listCreatorCourses(creator.id);
    return new Response(JSON.stringify(courses), { headers: { "Content-Type": "application/json" } });
  }

  const query = url.searchParams.get("q") || undefined;
  const tagParam = url.searchParams.get("tags");
  const tagSlugs = tagParam ? tagParam.split(",") : undefined;
  const sort = (url.searchParams.get("sort") as "newest" | "popular" | "price_asc" | "price_desc") || "newest";

  const courses = await searchCourses({ query, tagSlugs, sort, limit, offset });
  return new Response(JSON.stringify(courses), { headers: { "Content-Type": "application/json" } });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator) return new Response(JSON.stringify({ error: "Must be a creator" }), { status: 403, headers: { "Content-Type": "application/json" } });

  const body = await request.json();
  const { title, description, price_cents, currency } = body;
  if (!title) {
    return new Response(JSON.stringify({ error: "title is required" }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  const course = await createCourse(creator.id, title, description, price_cents, currency);
  ServerAnalytics.track(session.user.id, 'creator_course_created', { course_id: course.id, course_slug: course.slug });
  return new Response(JSON.stringify(course), { status: 201, headers: { "Content-Type": "application/json" } });
};
