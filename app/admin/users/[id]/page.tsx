"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Contact { id: string; name: string; relationship: string; phone: string; isPrimary: boolean }
interface Profile {
  firstName: string; lastName: string; age: number | null; cyclingType: string;
  clubName: string; clubId: string; clubContactName: string; clubContactPhone: string; clubContactEmail: string;
  bloodType: string; photoUrl: string | null; updatedAt: string; contacts: Contact[];
}
interface Addr { id: string; fullName: string; address1: string; address2: string; city: string; state: string; zipCode: string; country: string; phone: string; isDefault: boolean }
interface Tag { tagSlug: string; isActive: boolean; createdAt: string; _count: { taps: number } }
interface UserDetail {
  id: string; email: string; role: string; createdAt: string;
  profile: Profile | null; nfcTag: Tag | null; shippingAddresses: Addr[];
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1" style={{ fontFamily: "Space Mono, monospace" }}>{label}</p>
      <p className="text-nfc-dark text-sm break-words">{value === "" || value === null || value === undefined ? <span className="text-nfc-subtle">—</span> : value}</p>
    </div>
  );
}

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [u, setU] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function load() {
    setLoading(true);
    fetch(`/api/admin/users/${id}`).then((r) => r.json()).then((d) => {
      if (d && d.id) { setU(d); setSlug(d.nfcTag?.tagSlug || ""); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }
  useEffect(() => { if (id) load(); }, [id]);

  async function saveSlug() {
    setSaving(true); setMsg(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setTagSlug", tagSlug: slug }),
    });
    const d = await res.json();
    if (res.ok) { setMsg({ ok: true, text: "Tag URL updated" }); load(); }
    else setMsg({ ok: false, text: d.error || "Failed to update" });
    setSaving(false);
  }

  if (loading) return <p className="text-nfc-muted text-sm">Loading…</p>;
  if (!u) return <p className="text-nfc-muted text-sm">User not found. <Link href="/admin/users" className="text-nfc-red underline">Back to users</Link></p>;

  const p = u.profile;
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <Link href="/admin/users" className="text-sm text-nfc-muted hover:text-nfc-dark">← Back to users</Link>
        <div className="flex items-center gap-3 mt-3">
          <div className="w-12 h-12 rounded-full bg-nfc-red-light flex items-center justify-center text-nfc-red font-bold text-lg">
            {(p?.firstName || u.email)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">
              {p?.firstName || p?.lastName ? `${p?.firstName} ${p?.lastName}`.trim() : u.email}
            </h1>
            <p className="text-nfc-muted text-sm">{u.email} · <span className="uppercase">{u.role}</span></p>
          </div>
        </div>
      </div>

      {/* NFC Tag URL editor */}
      <div className="bg-white rounded-2xl border border-nfc-border p-5 mb-5">
        <h2 className="font-bold text-nfc-dark mb-3">NFC Tag URL</h2>
        {u.nfcTag ? (
          <>
            <p className="text-xs text-nfc-muted mb-2">Public card link — this is the slug encoded on the physical tag.</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-nfc-subtle">{origin}/tag/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-nfc-border text-sm font-mono text-nfc-dark focus:border-nfc-red focus:outline-none"
                placeholder="tag-slug"
              />
              <button onClick={saveSlug} disabled={saving} className="px-4 py-2 bg-nfc-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Save"}
              </button>
              <a href={`/tag/${u.nfcTag.tagSlug}`} target="_blank" className="px-4 py-2 bg-nfc-dark text-white rounded-lg text-sm font-bold hover:bg-nfc-dark/80 transition-colors">View card</a>
            </div>
            <p className="text-xs text-nfc-subtle mt-2">Only lowercase letters, numbers and hyphens. {u.nfcTag._count.taps} taps · {u.nfcTag.isActive ? "Active" : "Disabled"}</p>
            {msg && <p className={`text-sm mt-2 font-medium ${msg.ok ? "text-green-600" : "text-nfc-red"}`}>{msg.text}</p>}
          </>
        ) : <p className="text-sm text-nfc-subtle">This user has no NFC tag.</p>}
      </div>

      {/* Profile fields */}
      <div className="bg-white rounded-2xl border border-nfc-border p-5 mb-5">
        <h2 className="font-bold text-nfc-dark mb-4">Profile</h2>
        {p ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Field label="First name" value={p.firstName} />
            <Field label="Last name" value={p.lastName} />
            <Field label="Age" value={p.age} />
            <Field label="Cycling type" value={p.cyclingType} />
            <Field label="Blood type" value={p.bloodType} />
            <Field label="Club name" value={p.clubName} />
            <Field label="Club ID" value={p.clubId} />
            <Field label="Club contact name" value={p.clubContactName} />
            <Field label="Club contact phone" value={p.clubContactPhone} />
            <Field label="Club contact email" value={p.clubContactEmail} />
            <Field label="Photo" value={p.photoUrl ? <a href={p.photoUrl} target="_blank" className="text-nfc-red underline">View</a> : ""} />
            <Field label="Profile updated" value={new Date(p.updatedAt).toLocaleString("en-IN")} />
          </div>
        ) : <p className="text-sm text-nfc-subtle">No profile created yet.</p>}
      </div>

      {/* Emergency contacts */}
      <div className="bg-white rounded-2xl border border-nfc-border p-5 mb-5">
        <h2 className="font-bold text-nfc-dark mb-4">Emergency contacts</h2>
        {p && p.contacts.length > 0 ? (
          <div className="space-y-2">
            {p.contacts.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm border-b border-nfc-border/50 pb-2 last:border-0">
                <span className="text-nfc-dark font-medium">{c.name} {c.isPrimary && <span className="text-xs text-nfc-red">(primary)</span>}</span>
                <span className="text-nfc-muted">{c.relationship}</span>
                <span className="font-mono text-nfc-dark">{c.phone}</span>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-nfc-subtle">No emergency contacts.</p>}
      </div>

      {/* Shipping addresses */}
      <div className="bg-white rounded-2xl border border-nfc-border p-5">
        <h2 className="font-bold text-nfc-dark mb-4">Shipping addresses</h2>
        {u.shippingAddresses.length > 0 ? (
          <div className="space-y-3">
            {u.shippingAddresses.map((a) => (
              <div key={a.id} className="text-sm text-nfc-dark leading-relaxed border-b border-nfc-border/50 pb-2 last:border-0">
                <span className="font-medium">{a.fullName}</span>{a.isDefault && <span className="text-xs text-nfc-red ml-2">(default)</span>}<br />
                {a.address1}{a.address2 ? `, ${a.address2}` : ""}, {a.city}, {a.state} {a.zipCode}, {a.country}{a.phone ? ` · ${a.phone}` : ""}
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-nfc-subtle">No shipping addresses.</p>}
      </div>
    </div>
  );
}
