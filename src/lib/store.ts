import { CONFIG_ROW_ID } from "./config";
import { CONFIG_TABLE, LEADS_TABLE, getServiceClient } from "./supabase";

/* ------------------------------- config -------------------------------- */

export async function loadStoredConfig(): Promise<unknown> {
  const sb = getServiceClient();
  if (!sb) return {};
  const { data, error } = await sb
    .from(CONFIG_TABLE)
    .select("data")
    .eq("id", CONFIG_ROW_ID)
    .maybeSingle();
  if (error) return {};
  return data?.data ?? {};
}

export async function saveStoredConfig(data: unknown): Promise<void> {
  const sb = getServiceClient();
  if (!sb) throw new Error("Supabase is not configured");
  const { error } = await sb
    .from(CONFIG_TABLE)
    .upsert({ id: CONFIG_ROW_ID, data, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/* -------------------------------- leads -------------------------------- */

export interface LeadPayload {
  email: string;
  event: "start" | "end";
  score?: number;
  badge?: string;
  timeUp?: boolean;
}

export interface LeadRow {
  email: string;
  plays: number;
  best_score: number;
  best_badge: string | null;
  unlocked_playbook: boolean;
  created_at: string;
  updated_at: string;
}

export async function upsertLead(payload: LeadPayload): Promise<void> {
  const sb = getServiceClient();
  if (!sb) return; // graceful no-op when unconfigured
  const email = payload.email.trim().toLowerCase();
  if (!email) return;

  const { data: existing } = await sb
    .from(LEADS_TABLE)
    .select("*")
    .eq("email", email)
    .maybeSingle<LeadRow>();

  const now = new Date().toISOString();
  const base = {
    email,
    created_at: existing?.created_at ?? now,
    updated_at: now,
  };

  let row: Record<string, unknown>;
  if (payload.event === "end") {
    const best = Math.max(existing?.best_score ?? 0, payload.score ?? 0);
    const gold = (existing?.unlocked_playbook ?? false) || payload.badge === "gold";
    row = {
      ...base,
      plays: existing?.plays ?? 1,
      best_score: best,
      best_badge: gold ? "gold" : payload.badge ?? existing?.best_badge ?? null,
      unlocked_playbook: gold,
    };
  } else {
    row = {
      ...base,
      plays: (existing?.plays ?? 0) + 1,
      best_score: existing?.best_score ?? 0,
      best_badge: existing?.best_badge ?? null,
      unlocked_playbook: existing?.unlocked_playbook ?? false,
    };
  }

  await sb.from(LEADS_TABLE).upsert(row, { onConflict: "email" });
}

export async function listLeads(): Promise<LeadRow[]> {
  const sb = getServiceClient();
  if (!sb) return [];
  const { data } = await sb
    .from(LEADS_TABLE)
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(5000);
  return (data as LeadRow[]) ?? [];
}
