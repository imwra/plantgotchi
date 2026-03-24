import type { APIRoute } from 'astro';
import { listTags } from '../../../lib/db/lms-queries';

export const GET: APIRoute = async () => {
  const tags = await listTags();
  return new Response(JSON.stringify(tags), { headers: { 'Content-Type': 'application/json' } });
};
