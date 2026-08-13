"use client";
import { useEffect, useState } from "react";

interface St { id: string; key: string; label: string; color: string; order: number; isClosedState: boolean; active: boolean }

export default function StatusesPage() {
  const [items, setItems] = useState<St[]>([]);
  const [nf, setNf] = useState({ key: "", label: "", color: "#64748b", isClosedState: false });
  const load = () => fetch("/api/admin/statuses").then((r) => r.json()).then((d) => setItems(d.statuses || []));
  useEffect(() => { load(); }, []);
  async function add() { if (!nf.key || !nf.label) return; await fetch("/api/admin/statuses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nf) }); setNf({ key: "", label: "", color: "#64748b", isClosedState: false }); load(); }
  async function toggle(s: St) { await fetch("/api/admin/statuses", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, active: !s.active }) }); load(); }
  const sel = "px-3 py-2 rounded-lg border border-nfc-border bg-white text-sm";
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-extrabold text-nfc-dark mb-1">Statuses</h1>
      <p className="text-nfc-muted text-sm mb-4">Configure the ticket workflow statuses.</p>
      <div className="bg-white rounded-2xl border border-nfc-border p-4 mb-6 flex flex-wrap gap-2 items-end">
        <input className={sel} placeholder="KEY" value={nf.key} onChange={(e) => setNf({ ...nf, key: e.target.value })} />
        <input className={sel + " flex-1 min-w-32"} placeholder="Label" value={nf.label} onChange={(e) => setNf({ ...nf, label: e.target.value })} />
        <input type="color" className="h-9 w-12 rounded border border-nfc-border" value={nf.color} onChange={(e) => setNf({ ...nf, color: e.target.value })} />
        <label className="flex items-center gap-1.5 text-sm text-nfc-muted"><input type="checkbox" checked={nf.isClosedState} onChange={(e) => setNf({ ...nf, isClosedState: e.target.checked })} /> Closed state</label>
        <button onClick={add} className="px-4 py-2 bg-nfc-red text-white rounded-lg text-sm font-bold">Add</button>
      </div>
      <div className="space-y-2">{items.map((s) => (
        <div key={s.id} className="bg-white rounded-2xl border border-nfc-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full" style={{ background: s.color }} /><span className="font-bold text-nfc-dark">{s.label}</span><span className="text-xs text-nfc-subtle" style={{ fontFamily: "Space Mono, monospace" }}>{s.key}</span>{s.isClosedState && <span className="text-xs text-nfc-subtle">(closed)</span>}</div>
          <button onClick={() => toggle(s)} className={`text-xs font-bold ${s.active ? "text-green-600" : "text-nfc-subtle"}`}>{s.active ? "Active" : "Inactive"}</button>
        </div>
      ))}</div>
    </div>
  );
}
