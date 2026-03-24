import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getCreatorByUserId } from '../../../lib/db/lms-queries';
import { generateUploadUrl, generateKey, getPublicUrl } from '../../../lib/r2';

export const POST: APIRoute = async ({ request }) => {
  const session = await getSession(request);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator) return new Response('Creator profile required', { status: 403 });

  const { filename, content_type } = await request.json();
  if (!filename || !content_type) return new Response('filename and content_type required', { status: 400 });

  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf'];
  if (!allowed.includes(content_type)) return new Response('Unsupported file type', { status: 400 });

  const key = generateKey(creator.id, filename);
  const uploadUrl = await generateUploadUrl(key, content_type);
  const publicUrl = getPublicUrl(key);

  return new Response(JSON.stringify({ upload_url: uploadUrl, r2_key: key, public_url: publicUrl }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
