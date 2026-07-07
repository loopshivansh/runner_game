import { NextRequest, NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { listLeads } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Protected: list captured leads, or export as CSV with ?format=csv. */
export async function GET(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const leads = await listLeads();

  if (req.nextUrl.searchParams.get("format") === "csv") {
    const header = "email,plays,best_score,best_badge,unlocked_playbook,created_at,updated_at";
    const rows = leads.map((l) =>
      [
        l.email,
        l.plays,
        l.best_score,
        l.best_badge ?? "",
        l.unlocked_playbook,
        l.created_at,
        l.updated_at,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="loop-runner-leads.csv"`,
      },
    });
  }

  return NextResponse.json({ leads });
}
