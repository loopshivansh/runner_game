import { createHash } from "crypto";
import { cookies } from "next/headers";

/**
 * Minimal cookie-based auth for the dashboard. The session cookie stores a hash
 * of the configured password; only a correct login can produce it. Good enough
 * for a single-team marketing tool (no PII beyond captured emails).
 */

export const SESSION_COOKIE = "lr_session";

function password(): string {
  return process.env.DASHBOARD_PASSWORD || "loop-admin";
}

export function sessionToken(): string {
  return createHash("sha256")
    .update(`${password()}::loop-runner-dash`)
    .digest("hex");
}

export function verifyPassword(input: string): boolean {
  return input === password();
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === sessionToken();
}
