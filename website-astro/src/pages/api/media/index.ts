import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getCreatorByUserId } from '../../../lib/db/lms-queries';
import { listCreatorMedia, createMediaAsset } from '../../../lib/db/media-queries';

export const GET: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator) return new Response('[]', { headers: { 'Content-Type': 'application/json' } });

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '50') || 50;
  const offset = parseInt(url.searchParams.get('offset') || '0') || 0;
  const media = await listCreatorMedia(creator.id, limit, offset);

  return new Response(JSON.stringify(media), { headers: { 'Content-Type': 'application/json' } });
};

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator) return new Response('Creator profile required', { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
  const { filename, content_type, size_bytes, r2_key, public_url, alt_text } = body as { filename?: string; content_type?: string; size_bytes?: number; r2_key?: string; public_url?: string; alt_text?: string };
  if (!filename || !r2_key || !public_url) return new Response('Missing required fields', { status: 400 });

  const asset = await createMediaAsset(creator.id, filename, content_type, size_bytes, r2_key, public_url, alt_text);
  return new Response(JSON.stringify(asset), { status: 201, headers: { 'Content-Type': 'application/json' } });
};
