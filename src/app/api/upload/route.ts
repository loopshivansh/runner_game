import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { ASSET_BUCKET, getServiceClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Protected: upload a brand/game asset to Supabase Storage, return public URL. */
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const sb = getServiceClient();
  if (!sb) {
    return NextResponse.json(
      { error: "Supabase is not configured — set env vars to enable uploads." },
      { status: 500 },
    );
  }
  const form = await req.formData();
  const file = form.get("file");
  const slot = String(form.get("slot") || "asset").replace(/[^a-z0-9_-]/gi, "");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${slot}/${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await sb.storage
    .from(ASSET_BUCKET)
    .upload(path, buf, { contentType: file.type || "image/png", upsert: true });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const { data } = sb.storage.from(ASSET_BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
