import { getSession } from "./auth";

export async function requireAdmin(request: Request): Promise<{ userId: string; error?: never } | { error: Response; userId?: never }> {
  const session = await getSession(request);
  if (!session) {
    return { error: new Response("Unauthorized", { status: 401 }) };
  }
  if ((session.user as any).role !== "admin") {
    return { error: new Response("Forbidden", { status: 403 }) };
  }
  return { userId: session.user.id };
}
