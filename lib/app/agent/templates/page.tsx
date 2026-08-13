"use client";
import { useEffect, useState } from "react";

interface Tpl { id: string; key: string; subject: string; body: string; channel: string; active: boolean }

export default function TemplatesPage() {
  const [items, setItems] = useState<Tpl[]>([]);
  const [saved, setSaved] = useState("");
  const load = () => fetch("/api/admin/templates").then((r) => r.json()).then((d) => setItems(d.templates || []));
  useEffect(() => { load(); }, []);
  function edit(id: string, k: string, v: string | boolean) { setItems((p) => p.map((t) => t.id === id ? { ...t, [k]: v } : t)); }
  async function save(t: Tpl) { await fetch("/api/admin/templates", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) }); setSaved(t.id); setTimeout(() => setSaved(""), 1500); }
  const sel = "w-full px-3 py-2 rounded-lg border border-nfc-border bg-white text-sm";
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-nfc-dark mb-1">Notification Templates</h1>
      <p className="text-nfc-muted text-sm mb-4">Customize the messages sent to users. Use placeholders like {"{{ticketNo}}"}, {"{{subject}}"}, {"{{agent}}"}, {"{{status}}"}.</p>
      <div className="space-y-3">{items.map((t) => (
        <div key={t.id} className="bg-white rounded-2xl border border-nfc-border p-4 space-y-2">
          <div className="flex items-center justify-between"><span className="text-xs font-bold text-nfc-subtle" style={{ fontFamily: "Space Mono, monospace" }}>{t.key}</span>
            <select className="text-xs border border-nfc-border rounded px-2 py-1" value={t.channel} onChange={(e) => edit(t.id, "channel", e.target.value)}><option value="IN_APP">In-app</option><option value="EMAIL">Email</option><option value="BOTH">Both</option></select></div>
          <input className={sel} value={t.subject} onChange={(e) => edit(t.id, "subject", e.target.value)} />
          <textarea className={sel} rows={2} value={t.body} onChange={(e) => edit(t.id, "body", e.target.value)} />
          <div className="flex justify-end"><button onClick={() => save(t)} className="px-4 py-1.5 bg-nfc-red text-white rounded-lg text-sm font-bold">{saved === t.id ? "Saved ✓" : "Save"}</button></div>
        </div>
      ))}</div>
    </div>
  );
}
