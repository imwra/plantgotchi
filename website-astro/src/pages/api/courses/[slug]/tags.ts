import type { APIRoute } from 'astro';
import { getSession } from '../../../../lib/auth';
import { getCourseBySlug, getCreatorByUserId, getCourseTags, addTagToCourse, removeTagFromCourse } from '../../../../lib/db/lms-queries';

export const GET: APIRoute = async ({ params }) => {
  const course = await getCourseBySlug(params.slug!);
  if (!course) return new Response('Not found', { status: 404 });
  const tags = await getCourseTags(course.id);
  return new Response(JSON.stringify(tags), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  const course = await getCourseBySlug(params.slug!);
  if (!course || !creator || course.creator_id !== creator.id) return new Response('Forbidden', { status: 403 });

  let body: { tag_id?: string };
  try { body = await request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  if (!body.tag_id) return new Response('tag_id required', { status: 400 });

  await addTagToCourse(course.id, body.tag_id);
  return new Response(null, { status: 201 });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  const course = await getCourseBySlug(params.slug!);
  if (!course || !creator || course.creator_id !== creator.id) return new Response('Forbidden', { status: 403 });

  const url = new URL(request.url);
  const tagId = url.searchParams.get('tag_id');
  if (tagId) await removeTagFromCourse(course.id, tagId);
  return new Response(null, { status: 204 });
};
