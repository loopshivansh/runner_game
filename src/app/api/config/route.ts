import { NextRequest, NextResponse } from "next/server";
import { mergeConfig } from "@/lib/config";
import { isAuthed } from "@/lib/auth";
import { loadStoredConfig, saveStoredConfig } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: the merged, always-valid config the game renders from. */
export async function GET() {
  const stored = await loadStoredConfig();
  return NextResponse.json(mergeConfig(stored), {
    headers: { "Cache-Control": "no-store" },
  });
}

/** Protected: save config from the dashboard. */
export async function PUT(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const merged = mergeConfig(body);
    await saveStoredConfig(merged);
    return NextResponse.json({ ok: true, config: merged });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "save failed" },
      { status: 500 },
    );
  }
}
