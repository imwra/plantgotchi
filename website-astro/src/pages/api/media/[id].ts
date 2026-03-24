import type { APIRoute } from 'astro';
import { getSession } from '../../../lib/auth';
import { getCreatorByUserId } from '../../../lib/db/lms-queries';
import { getMediaAsset, deleteMediaAsset } from '../../../lib/db/media-queries';
import { deleteObject } from '../../../lib/r2';

export const DELETE: APIRoute = async ({ request, params }) => {
  const session = await getSession(request);
  if (!session) return new Response('Unauthorized', { status: 401 });

  const creator = await getCreatorByUserId(session.user.id);
  if (!creator) return new Response('Forbidden', { status: 403 });

  const asset = await getMediaAsset(params.id!);
  if (!asset) return new Response('Not found', { status: 404 });
  if (asset.creator_id !== creator.id) return new Response('Forbidden', { status: 403 });

  await deleteObject(asset.r2_key);
  await deleteMediaAsset(asset.id);

  return new Response(null, { status: 204 });
};
