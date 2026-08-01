"use client";
import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [tagPrice, setTagPrice] = useState("");
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [sessionTimeout, setSessionTimeout] = useState("30");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      setTagPrice(String(d.tagPrice ?? ""));
      setUpiId(d.upiId || "");
      setPayeeName(d.payeeName || "");
      setSessionTimeout(String(d.sessionTimeout ?? 30));
    });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tagPrice, upiId, payeeName, sessionTimeout }) });
    setSaving(false);
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Store Settings</h1>
        <p className="text-nfc-muted text-sm mt-1">Set the tag price and UPI payment details used at checkout</p>
      </div>

      {saved && <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">✓ Settings saved</div>}

      <form onSubmit={save} className="bg-white rounded-2xl border border-nfc-border p-6 max-w-lg space-y-4">
        <div>
          <label className="block text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>Tag Price (₹)</label>
          <input type="number" min="0" value={tagPrice} onChange={(e) => setTagPrice(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-nfc-border text-sm text-nfc-dark focus:border-nfc-red focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>UPI ID</label>
          <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@okhdfcbank" className="w-full px-3 py-2.5 rounded-xl border border-nfc-border text-sm text-nfc-dark focus:border-nfc-red focus:outline-none" />
          <p className="text-xs text-nfc-subtle mt-1.5">Leave blank to show a placeholder QR. When set, a scannable UPI QR is generated at checkout.</p>
        </div>
        <div>
          <label className="block text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>Payee Name</label>
          <input value={payeeName} onChange={(e) => setPayeeName(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-nfc-border text-sm text-nfc-dark focus:border-nfc-red focus:outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>Auto-logout after (minutes)</label>
          <input type="number" min="1" max="1440" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-nfc-border text-sm text-nfc-dark focus:border-nfc-red focus:outline-none" />
          <p className="text-xs text-nfc-subtle mt-1.5">Users are signed out automatically after this many minutes of inactivity. Default 30.</p>
        </div>
        <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-xl bg-nfc-red text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
