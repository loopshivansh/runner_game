import { NextRequest, NextResponse } from "next/server";
import { upsertLead } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: capture a lead email + game result. Never blocks the player. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email : "";
    if (!email) return NextResponse.json({ ok: true });
    await upsertLead({
      email,
      event: body.event === "end" ? "end" : "start",
      score: Number(body.score) || 0,
      badge: typeof body.badge === "string" ? body.badge : undefined,
      timeUp: Boolean(body.timeUp),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
