"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_CONFIG, mergeConfig, type GameConfig } from "@/lib/config";
import { LoopMark } from "./brand";

type Tab = "design" | "content" | "gameplay" | "assets" | "leads";

export default function Dashboard() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [cfg, setCfg] = useState<GameConfig>(DEFAULT_CONFIG);
  const [tab, setTab] = useState<Tab>("design");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => setAuthed(Boolean(d.authed)))
      .catch(() => setAuthed(false));
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => setCfg(mergeConfig(d)))
      .catch(() => {});
  }, []);

  function patch<S extends keyof GameConfig>(s: S, p: Partial<GameConfig[S]>) {
    setCfg((c) => ({ ...c, [s]: { ...c[s], ...p } }));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    const res = await fetch("/api/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cfg),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setPreviewKey((k) => k + 1);
      setTimeout(() => setSaved(false), 2500);
    } else if (res.status === 401) {
      setAuthed(false);
    } else {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Save failed");
    }
  }

  if (authed === null) {
    return <div className="min-h-screen grid place-items-center text-white/50">Loading…</div>;
  }
  if (!authed) return <Login onDone={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-[#0b0b0e] text-white">
      {/* header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-[#0b0b0e]/95 backdrop-blur">
        <LoopMark size={26} color={cfg.brand.primaryColor} />
        <div className="font-display font-semibold text-lg">Loop Runner</div>
        <span className="text-white/40 text-sm">Dashboard</span>
        <div className="ml-auto flex items-center gap-3">
          {saved && <span className="text-emerald-400 text-sm">Saved ✓</span>}
          <a
            href="/"
            target="_blank"
            className="text-sm text-white/60 hover:text-white underline underline-offset-2"
          >
            Open game ↗
          </a>
          <button
            onClick={save}
            disabled={saving}
            className="rounded-full bg-white text-black font-display font-semibold px-5 py-2 text-sm disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          <button
            onClick={async () => {
              await fetch("/api/auth", { method: "DELETE" });
              setAuthed(false);
            }}
            className="text-sm text-white/40 hover:text-white"
          >
            Log out
          </button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* editor */}
        <div className="flex-1 max-w-3xl px-5 py-6">
          <nav className="flex gap-1 mb-6 flex-wrap">
            {(["design", "content", "gameplay", "assets", "leads"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-full px-4 py-1.5 text-sm capitalize font-medium transition ${
                  tab === t ? "bg-white text-black" : "bg-white/5 text-white/60 hover:bg-white/10"
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          {tab === "design" && <DesignTab cfg={cfg} patch={patch} />}
          {tab === "content" && <ContentTab cfg={cfg} patch={patch} />}
          {tab === "gameplay" && <GameplayTab cfg={cfg} patch={patch} />}
          {tab === "assets" && <AssetsTab cfg={cfg} patch={patch} />}
          {tab === "leads" && <LeadsTab />}
        </div>

        {/* live preview */}
        <div className="hidden lg:block w-[440px] shrink-0 border-l border-white/10 p-6 sticky top-[57px] self-start h-[calc(100vh-57px)]">
          <div className="text-sm text-white/50 mb-3">Live preview (Save to refresh)</div>
          <div className="mx-auto rounded-[28px] overflow-hidden border-8 border-[#17171b] shadow-2xl w-[300px] h-[640px] max-h-[calc(100vh-140px)]">
            <iframe key={previewKey} src="/" className="w-full h-full" title="preview" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Login --------------------------------- */
function Login({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit() {
    setBusy(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    setBusy(false);
    if (res.ok) onDone();
    else setErr("Incorrect password");
  }
  return (
    <div className="min-h-screen grid place-items-center bg-[#0b0b0e] text-white px-6">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <LoopMark size={30} />
          <span className="font-display font-semibold text-xl">Loop Runner</span>
        </div>
        <h1 className="font-display font-semibold text-lg mb-1">Marketing dashboard</h1>
        <p className="text-white/50 text-sm mb-5">Enter the dashboard password to continue.</p>
        <input
          type="password"
          value={pw}
          onChange={(e) => {
            setPw(e.target.value);
            setErr("");
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Password"
          className="w-full rounded-lg bg-black/40 border border-white/15 px-4 py-3 outline-none focus:border-white/40"
        />
        {err && <p className="text-red-400 text-sm mt-2">{err}</p>}
        <button
          onClick={submit}
          disabled={busy}
          className="w-full mt-4 rounded-lg bg-white text-black font-display font-semibold py-3 disabled:opacity-60"
        >
          {busy ? "Checking…" : "Enter"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------- Field helpers ---------------------------- */
type PatchFn = <S extends keyof GameConfig>(s: S, p: Partial<GameConfig[S]>) => void;

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-display font-semibold text-white/90 mb-3 text-sm uppercase tracking-wide">
        {title}
      </h2>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-sm text-white/70 mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-xs text-white/35 mt-1">{hint}</div>}
    </label>
  );
}

/** Same visual as Field but a plain div — used where children contain buttons + hidden file inputs. */
function FieldBox({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="block">
      <div className="text-sm text-white/70 mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-xs text-white/35 mt-1">{hint}</div>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm outline-none focus:border-white/40";

function Text({
  value,
  onChange,
  ...r
}: { value: string; onChange: (v: string) => void } & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange"
>) {
  return <input {...r} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />;
}
function Area({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return <textarea rows={2} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />;
}
function Color({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 rounded bg-transparent border border-white/15" />
      <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
function Num({ value, onChange, step = 1 }: { value: number; onChange: (v: number) => void; step?: number }) {
  return <input type="number" step={step} className={inputCls} value={value} onChange={(e) => onChange(Number(e.target.value))} />;
}
function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full rounded-lg bg-black/40 border border-white/15 px-3 py-2 text-sm"
    >
      <span className="text-white/70">{label}</span>
      <span className={`w-10 h-6 rounded-full p-0.5 transition ${value ? "bg-emerald-500" : "bg-white/20"}`}>
        <span className={`block w-5 h-5 rounded-full bg-white transition ${value ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

function Upload({ label, value, slot, onChange }: { label: string; value: string; slot: string; onChange: (url: string) => void }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  async function handle(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slot", slot);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await res.json();
    setBusy(false);
    if (j.url) onChange(j.url);
    else alert(j.error || "Upload failed");
  }
  return (
    <FieldBox label={label}>
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 rounded-lg bg-black/40 border border-white/15 grid place-items-center overflow-hidden shrink-0">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-contain" />
          ) : (
            <span className="text-white/25 text-xs">none</span>
          )}
        </div>
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
        <button onClick={() => ref.current?.click()} className="rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2 text-sm" disabled={busy}>
          {busy ? "Uploading…" : value ? "Replace" : "Upload"}
        </button>
        {value && (
          <button onClick={() => onChange("")} className="text-white/40 hover:text-white text-sm">
            Clear
          </button>
        )}
      </div>
    </FieldBox>
  );
}

function MultiUpload({ label, values, slot, onChange }: { label: string; values: string[]; slot: string; onChange: (urls: string[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function add(file: File) {
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("slot", slot);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const j = await res.json();
    setBusy(false);
    if (j.url) onChange([...values, j.url]);
    else alert(j.error || "Upload failed");
  }
  return (
    <FieldBox label={label} hint="Add one or more images. Shown in rotation in-game.">
      <div className="flex flex-wrap gap-2">
        {values.map((v, i) => (
          <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/15 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={v} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className="absolute top-0.5 right-0.5 bg-black/70 rounded-full w-5 h-5 text-xs leading-none"
            >
              ×
            </button>
          </div>
        ))}
        <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && add(e.target.files[0])} />
        <button
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="w-16 h-16 rounded-lg border border-dashed border-white/25 text-white/40 hover:text-white hover:border-white/50 text-2xl"
        >
          {busy ? "…" : "+"}
        </button>
      </div>
    </FieldBox>
  );
}

/* ------------------------------- Tabs ---------------------------------- */
function DesignTab({ cfg, patch }: { cfg: GameConfig; patch: PatchFn }) {
  return (
    <>
      <Section title="Brand">
        <Field label="Brand name"><Text value={cfg.brand.name} onChange={(v) => patch("brand", { name: v })} /></Field>
        <Upload label="Logo" value={cfg.brand.logoUrl} slot="logo" onChange={(v) => patch("brand", { logoUrl: v })} />
      </Section>
      <Section title="Colors">
        <Field label="Primary (Loop purple)"><Color value={cfg.brand.primaryColor} onChange={(v) => patch("brand", { primaryColor: v })} /></Field>
        <Field label="Gold badge / win"><Color value={cfg.brand.goldColor} onChange={(v) => patch("brand", { goldColor: v })} /></Field>
        <Field label="Silver badge"><Color value={cfg.brand.silverColor} onChange={(v) => patch("brand", { silverColor: v })} /></Field>
      </Section>
    </>
  );
}

function ContentTab({ cfg, patch }: { cfg: GameConfig; patch: PatchFn }) {
  const c = cfg.copy;
  const set = (k: keyof GameConfig["copy"]) => (v: string) => patch("copy", { [k]: v } as Partial<GameConfig["copy"]>);
  return (
    <>
      <Section title="Splash">
        <Field label="Headline"><Area value={c.splashTitle} onChange={set("splashTitle")} /></Field>
        <Field label="Play button"><Text value={c.playButton} onChange={set("playButton")} /></Field>
        <Field label="Playbook link label"><Text value={c.playbookLinkLabel} onChange={set("playbookLinkLabel")} /></Field>
      </Section>
      <Section title="Lead magnet">
        <Field label="Playbook name"><Text value={c.playbookName} onChange={set("playbookName")} /></Field>
        <Field label="Info subtitle"><Text value={c.infoSubtitle} onChange={set("infoSubtitle")} /></Field>
        <Field label="Info footer"><Area value={c.infoFooter} onChange={set("infoFooter")} /></Field>
        <Field label="Step 1"><Text value={c.infoStep1} onChange={set("infoStep1")} /></Field>
        <Field label="Step 2"><Text value={c.infoStep2} onChange={set("infoStep2")} /></Field>
      </Section>
      <Section title="Email capture">
        <Field label="Placeholder"><Text value={c.emailPlaceholder} onChange={set("emailPlaceholder")} /></Field>
        <Field label="Helper text"><Area value={c.emailHelper} onChange={set("emailHelper")} /></Field>
        <Field label="Start button"><Text value={c.startButton} onChange={set("startButton")} /></Field>
      </Section>
      <Section title="End screens">
        <Field label="Win title"><Text value={c.winTitle} onChange={set("winTitle")} /></Field>
        <Field label="Win message"><Area value={c.winMessage} onChange={set("winMessage")} /></Field>
        <Field label="Lose title"><Text value={c.loseTitle} onChange={set("loseTitle")} /></Field>
        <Field label="Lose message"><Area value={c.loseMessage} onChange={set("loseMessage")} /></Field>
        <Field label="Share button"><Text value={c.shareButton} onChange={set("shareButton")} /></Field>
      </Section>
    </>
  );
}

function GameplayTab({ cfg, patch }: { cfg: GameConfig; patch: PatchFn }) {
  const g = cfg.game;
  return (
    <>
      <Section title="Rules">
        <Field label="Round duration (seconds)"><Num value={g.durationSeconds} onChange={(v) => patch("game", { durationSeconds: v })} /></Field>
        <Field label="Gold score (unlocks playbook)" hint="Reach this before time runs out to win gold."><Num value={g.goldScore} onChange={(v) => patch("game", { goldScore: v })} /></Field>
        <Field label="Points per collectible"><Num value={g.coinValue} onChange={(v) => patch("game", { coinValue: v })} /></Field>
        <Toggle label="Hitting an obstacle ends the run" value={g.obstacleEndsRun} onChange={(v) => patch("game", { obstacleEndsRun: v })} />
      </Section>
      <Section title="Difficulty">
        <Field label="Base speed" hint="1 = normal"><Num step={0.1} value={g.baseSpeed} onChange={(v) => patch("game", { baseSpeed: v })} /></Field>
        <Field label="Speed ramp" hint="How much faster by the end"><Num step={0.1} value={g.speedRamp} onChange={(v) => patch("game", { speedRamp: v })} /></Field>
        <Field label="Spawn interval (seconds)"><Num step={0.05} value={g.spawnInterval} onChange={(v) => patch("game", { spawnInterval: v })} /></Field>
      </Section>
      <Section title="Links">
        <Field label="Playbook download URL"><Text value={cfg.links.playbookUrl} onChange={(v) => patch("links", { playbookUrl: v })} /></Field>
        <Field label="Offer / share URL"><Text value={cfg.links.offerUrl} onChange={(v) => patch("links", { offerUrl: v })} /></Field>
        <Field label="Share text"><Area value={cfg.links.shareText} onChange={(v) => patch("links", { shareText: v })} /></Field>
      </Section>
      <Section title="Lead capture">
        <Toggle label="Capture email before playing" value={cfg.leadCapture.enabled} onChange={(v) => patch("leadCapture", { enabled: v })} />
        <Toggle label="Email required" value={cfg.leadCapture.requireEmail} onChange={(v) => patch("leadCapture", { requireEmail: v })} />
      </Section>
    </>
  );
}

function AssetsTab({ cfg, patch }: { cfg: GameConfig; patch: PatchFn }) {
  const a = cfg.assets;
  return (
    <Section title="Game art (optional — leave empty for built-in art)">
      <Upload label="Runner character" value={a.characterUrl} slot="character" onChange={(v) => patch("assets", { characterUrl: v })} />
      <Upload label="Collectible / coin" value={a.coinUrl} slot="coin" onChange={(v) => patch("assets", { coinUrl: v })} />
      <MultiUpload label="Obstacles" values={a.obstacleUrls} slot="obstacle" onChange={(v) => patch("assets", { obstacleUrls: v })} />
      <MultiUpload label="Billboards (customer/product ads)" values={a.billboardUrls} slot="billboard" onChange={(v) => patch("assets", { billboardUrls: v })} />
      <Upload label="Gold badge" value={a.badgeGoldUrl} slot="badge-gold" onChange={(v) => patch("assets", { badgeGoldUrl: v })} />
      <Upload label="Silver badge" value={a.badgeSilverUrl} slot="badge-silver" onChange={(v) => patch("assets", { badgeSilverUrl: v })} />
    </Section>
  );
}

/* ------------------------------- Leads --------------------------------- */
interface LeadRow {
  email: string;
  plays: number;
  best_score: number;
  best_badge: string | null;
  unlocked_playbook: boolean;
  updated_at: string;
}
function LeadsTab() {
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [err, setErr] = useState("");
  function load() {
    fetch("/api/leads")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((d) => setLeads(d.leads))
      .catch(() => setErr("Could not load leads. Is Supabase configured?"));
  }
  useEffect(load, []);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display font-semibold">Captured leads {leads ? `(${leads.length})` : ""}</h2>
        <button onClick={load} className="text-sm text-white/50 hover:text-white">Refresh</button>
        <a href="/api/leads?format=csv" className="ml-auto rounded-full bg-white/10 hover:bg-white/20 px-4 py-1.5 text-sm">
          Export CSV
        </a>
      </div>
      {err && <p className="text-amber-400 text-sm">{err}</p>}
      {leads && leads.length === 0 && <p className="text-white/40 text-sm">No leads yet.</p>}
      {leads && leads.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/5 text-white/50 text-left">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Plays</th>
                <th className="px-3 py-2">Best</th>
                <th className="px-3 py-2">Badge</th>
                <th className="px-3 py-2">Playbook</th>
                <th className="px-3 py-2">Last played</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.email} className="border-t border-white/10">
                  <td className="px-3 py-2">{l.email}</td>
                  <td className="px-3 py-2">{l.plays}</td>
                  <td className="px-3 py-2">{l.best_score}</td>
                  <td className="px-3 py-2 capitalize">{l.best_badge ?? "—"}</td>
                  <td className="px-3 py-2">{l.unlocked_playbook ? "✅" : "—"}</td>
                  <td className="px-3 py-2 text-white/50">{new Date(l.updated_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
