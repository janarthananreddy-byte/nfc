"use client";
import { useEffect, useState } from "react";

interface Cat { id: string; name: string; type: string; parentId: string | null; active: boolean; sortOrder: number }

export default function CategoriesPage() {
  const [cats, setCats] = useState<Cat[]>([]);
  const [nf, setNf] = useState({ name: "", type: "", parentId: "" });
  const load = () => fetch("/api/admin/categories").then((r) => r.json()).then((d) => setCats(d.categories || []));
  useEffect(() => { load(); }, []);
  async function add() { if (!nf.name) return; await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nf) }); setNf({ name: "", type: "", parentId: "" }); load(); }
  async function toggle(c: Cat) { await fetch("/api/admin/categories", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: c.id, active: !c.active }) }); load(); }
  const parents = cats.filter((c) => !c.parentId);
  const sel = "px-3 py-2 rounded-lg border border-nfc-border bg-white text-sm";
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-extrabold text-nfc-dark mb-4">Categories</h1>
      <div className="bg-white rounded-2xl border border-nfc-border p-4 mb-6 flex flex-wrap gap-2 items-end">
        <input className={sel + " flex-1 min-w-40"} placeholder="Category name" value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} />
        <select className={sel} value={nf.parentId} onChange={(e) => setNf({ ...nf, parentId: e.target.value })}><option value="">Top-level</option>{parents.map((p) => <option key={p.id} value={p.id}>Under {p.name}</option>)}</select>
        <input className={sel} placeholder="Type (e.g. Hardware)" value={nf.type} onChange={(e) => setNf({ ...nf, type: e.target.value })} />
        <button onClick={add} className="px-4 py-2 bg-nfc-red text-white rounded-lg text-sm font-bold">Add</button>
      </div>
      <div className="space-y-2">
        {parents.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-nfc-border p-4">
            <div className="flex items-center justify-between"><span className="font-bold text-nfc-dark">{p.name} <span className="text-xs text-nfc-subtle">({p.type})</span></span><button onClick={() => toggle(p)} className={`text-xs font-bold ${p.active ? "text-green-600" : "text-nfc-subtle"}`}>{p.active ? "Active" : "Inactive"}</button></div>
            <div className="mt-2 pl-4 space-y-1">{cats.filter((c) => c.parentId === p.id).map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm"><span className="text-nfc-muted">› {c.name}</span><button onClick={() => toggle(c)} className={`text-xs font-bold ${c.active ? "text-green-600" : "text-nfc-subtle"}`}>{c.active ? "Active" : "Inactive"}</button></div>
            ))}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
