"use client";
import { useEffect, useState } from "react";
import { UserNav } from "@/components/UserNav";

interface Address {
  fullName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Singapore", "UAE", "Other"];

export default function ShippingPage() {
  const [form, setForm] = useState<Address>({ fullName: "", address1: "", address2: "", city: "", state: "", zipCode: "", country: "India", phone: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState(false);

  useEffect(() => {
    fetch("/api/shipping").then((r) => r.json()).then((d) => {
      if (d && d.id) {
        setExisting(true);
        setForm({ fullName: d.fullName, address1: d.address1, address2: d.address2 || "", city: d.city, state: d.state, zipCode: d.zipCode, country: d.country || "India", phone: d.phone || "" });
      }
    });
  }, []);

  function update(field: keyof Address, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setExisting(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      const d = await res.json();
      setError(d.error || "Failed to save");
    }
  }

  return (
    <>
      <UserNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Shipping Address</h1>
          <p className="text-nfc-muted text-sm mt-1">We&apos;ll ship your physical NFC tag to this address</p>
        </div>

        {existing && !saved && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
            You have a saved address. Update it below if needed.
          </div>
        )}

        {saved && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
            ✓ Address saved successfully!
          </div>
        )}

        <div className="bg-white rounded-2xl border border-nfc-border p-6">
          {/* What you get */}
          <div className="flex items-start gap-4 p-4 bg-nfc-outer rounded-xl mb-6">
            <div className="w-10 h-10 rounded-full bg-nfc-red flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <div>
              <p className="font-bold text-nfc-dark text-sm">Your NFC Emergency ID Tag</p>
              <p className="text-xs text-nfc-muted mt-1 leading-relaxed">A small waterproof NFC sticker that attaches to your helmet or bike. When scanned by a first responder, it instantly shows your emergency card.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-nfc-red-light border border-nfc-red/20 text-nfc-red rounded-xl px-4 py-3 text-sm">{error}</div>}

            <Field label="Full Name *" value={form.fullName} onChange={(v) => update("fullName", v)} placeholder="Marco Reyes" required />
            <Field label="Address Line 1 *" value={form.address1} onChange={(v) => update("address1", v)} placeholder="123 Cycling Lane" required />
            <Field label="Address Line 2" value={form.address2} onChange={(v) => update("address2", v)} placeholder="Apt, Suite, Floor (optional)" />

            <div className="grid grid-cols-2 gap-4">
              <Field label="City *" value={form.city} onChange={(v) => update("city", v)} placeholder="Mumbai" required />
              <Field label="State / Province *" value={form.state} onChange={(v) => update("state", v)} placeholder="Maharashtra" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Zip / PIN Code *" value={form.zipCode} onChange={(v) => update("zipCode", v)} placeholder="400001" required />
              <div>
                <label className="block text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>Country</label>
                <select
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-nfc-border bg-nfc-bg text-nfc-dark text-sm focus:outline-none focus:border-nfc-red focus:ring-2 focus:ring-nfc-red/10 transition-colors"
                >
                  {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <Field label="Phone (for delivery)" value={form.phone} onChange={(v) => update("phone", v)} placeholder="+91 98765 43210" type="tel" />

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-nfc-red text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 text-sm mt-2"
            >
              {saving ? "Saving…" : existing ? "Update Address" : "Save Shipping Address"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 rounded-xl border border-nfc-border bg-nfc-bg text-nfc-dark text-sm focus:outline-none focus:border-nfc-red focus:ring-2 focus:ring-nfc-red/10 transition-colors"
      />
    </div>
  );
}
