import type { APIRoute } from "astro";
import { getSession } from "../../../lib/auth";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const POST: APIRoute = async ({ request, locals }) => {
  const session = await getSession(request);
  if (!session) return new Response("Unauthorized", { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return new Response(JSON.stringify({ error: "No file provided" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ error: "File must be JPEG, PNG, or WebP" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (file.size > MAX_SIZE) {
    return new Response(JSON.stringify({ error: "File must be under 5MB" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const ext = EXT_MAP[file.type] || "bin";
  const fileId = crypto.randomUUID();
  const key = `chat/${session.user.id}/${fileId}.${ext}`;

  // Try R2 bucket
  const r2 = (locals as any).runtime?.env?.CHAT_IMAGES;

  if (!r2) {
    // R2 not available — return placeholder
    return new Response(
      JSON.stringify({
        url: `/uploads/${key}`,
        placeholder: true,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const buffer = await file.arrayBuffer();
  await r2.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });

  return new Response(
    JSON.stringify({
      url: `/uploads/${key}`,
      placeholder: false,
    }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
};
