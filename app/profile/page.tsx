"use client";
import { useEffect, useState } from "react";
import { UserNav } from "@/components/UserNav";

interface Contact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  isPrimary: boolean;
}

interface ProfileData {
  firstName: string;
  lastName: string;
  age: string;
  cyclingType: string;
  clubName: string;
  clubId: string;
  bloodType: string;
  photoUrl: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CYCLING_TYPES = ["Road cyclist", "Mountain biker", "Track cyclist", "Triathlete", "BMX rider", "Gravel rider", "Touring cyclist"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    firstName: "", lastName: "", age: "", cyclingType: "Road cyclist",
    clubName: "", clubId: "", bloodType: "", photoUrl: "",
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", relationship: "", phone: "", isPrimary: false });
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      if (d.profile) {
        setProfile({
          firstName: d.profile.firstName || "",
          lastName: d.profile.lastName || "",
          age: d.profile.age ? String(d.profile.age) : "",
          cyclingType: d.profile.cyclingType || "Road cyclist",
          clubName: d.profile.clubName || "",
          clubId: d.profile.clubId || "",
          bloodType: d.profile.bloodType || "",
          photoUrl: d.profile.photoUrl || "",
        });
        setContacts(d.profile.contacts || []);
      }
    });
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function addContact(e: React.FormEvent) {
    e.preventDefault();
    if (editingContact) {
      const res = await fetch(`/api/contacts/${editingContact}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const updated = await res.json();
      setContacts((cs) => cs.map((c) => (c.id === editingContact ? updated : (contactForm.isPrimary ? { ...c, isPrimary: false } : c))));
      setEditingContact(null);
    } else {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactForm),
      });
      const c = await res.json();
      if (contactForm.isPrimary) {
        setContacts((cs) => [...cs.map((x) => ({ ...x, isPrimary: false })), c]);
      } else {
        setContacts((cs) => [...cs, c]);
      }
    }
    setContactForm({ name: "", relationship: "", phone: "", isPrimary: false });
    setShowContactForm(false);
  }

  async function deleteContact(id: string) {
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    setContacts((cs) => cs.filter((c) => c.id !== id));
  }

  function startEdit(c: Contact) {
    setContactForm({ name: c.name, relationship: c.relationship, phone: c.phone, isPrimary: c.isPrimary });
    setEditingContact(c.id);
    setShowContactForm(true);
  }

  return (
    <>
      <UserNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Your Profile</h1>
          <p className="text-nfc-muted text-sm mt-1">This information appears on your emergency card when your NFC tag is scanned</p>
        </div>

        {/* Profile Form */}
        <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-nfc-border p-6 mb-6">
          <h2 className="font-bold text-nfc-dark mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-nfc-red text-white text-xs flex items-center justify-center font-black">1</span>
            Cyclist Information
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="First Name" value={profile.firstName} onChange={(v) => setProfile((p) => ({ ...p, firstName: v }))} placeholder="Marco" required />
            <Field label="Last Name" value={profile.lastName} onChange={(v) => setProfile((p) => ({ ...p, lastName: v }))} placeholder="Reyes" required />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Age" type="number" value={profile.age} onChange={(v) => setProfile((p) => ({ ...p, age: v }))} placeholder="38" />
            <div>
              <label className="block text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>Cycling Type</label>
              <select
                value={profile.cyclingType}
                onChange={(e) => setProfile((p) => ({ ...p, cyclingType: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-nfc-border bg-nfc-bg text-nfc-dark text-sm focus:outline-none focus:border-nfc-red focus:ring-2 focus:ring-nfc-red/10 transition-colors"
              >
                {CYCLING_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Club Name" value={profile.clubName} onChange={(v) => setProfile((p) => ({ ...p, clubName: v }))} placeholder="Velocity Cycling Club" />
            <Field label="Club / Member ID" value={profile.clubId} onChange={(v) => setProfile((p) => ({ ...p, clubId: v }))} placeholder="VCC-2291" />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>Blood Type</label>
            <div className="flex flex-wrap gap-2">
              {BLOOD_TYPES.map((bt) => (
                <button
                  key={bt}
                  type="button"
                  onClick={() => setProfile((p) => ({ ...p, bloodType: bt }))}
                  className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-colors ${
                    profile.bloodType === bt
                      ? "border-nfc-red bg-nfc-red text-white"
                      : "border-nfc-border text-nfc-dark hover:border-nfc-red/40"
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <Field label="Photo URL (optional)" value={profile.photoUrl} onChange={(v) => setProfile((p) => ({ ...p, photoUrl: v }))} placeholder="https://..." type="url" />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-nfc-dark text-white font-bold py-3 rounded-xl hover:bg-nfc-dark/80 transition-colors disabled:opacity-60 text-sm"
          >
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Profile"}
          </button>
        </form>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-2xl border border-nfc-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-nfc-dark flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-nfc-red text-white text-xs flex items-center justify-center font-black">2</span>
              Emergency Contacts
            </h2>
            <button
              onClick={() => { setShowContactForm(true); setEditingContact(null); setContactForm({ name: "", relationship: "", phone: "", isPrimary: contacts.length === 0 }); }}
              className="px-3 py-1.5 bg-nfc-red text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
            >
              + Add Contact
            </button>
          </div>

          {contacts.length === 0 && !showContactForm && (
            <p className="text-nfc-muted text-sm text-center py-6">No contacts yet. Add your primary emergency contact.</p>
          )}

          <div className="space-y-3 mb-4">
            {contacts.map((c) => (
              <div key={c.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 ${c.isPrimary ? "border-nfc-red bg-nfc-red-light" : "border-nfc-border"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${c.isPrimary ? "bg-nfc-red" : "bg-nfc-outer"}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={c.isPrimary ? "#fff" : "#6b6660"} strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-nfc-dark text-sm">{c.name}</span>
                    {c.isPrimary && <span className="text-xs font-bold text-nfc-red bg-nfc-red-light px-2 py-0.5 rounded-md" style={{ fontFamily: "Space Mono, monospace" }}>PRIMARY</span>}
                  </div>
                  <p className="text-xs text-nfc-muted mt-0.5">{c.relationship} · {c.phone}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(c)} className="p-1.5 text-nfc-muted hover:text-nfc-dark transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button onClick={() => deleteContact(c.id)} className="p-1.5 text-nfc-muted hover:text-nfc-red transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {showContactForm && (
            <form onSubmit={addContact} className="border-2 border-nfc-red/20 rounded-xl p-4 bg-nfc-red-light/30">
              <h3 className="text-sm font-bold text-nfc-dark mb-3">{editingContact ? "Edit Contact" : "New Contact"}</h3>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <Field label="Full Name" value={contactForm.name} onChange={(v) => setContactForm((f) => ({ ...f, name: v }))} placeholder="Elena Reyes" required />
                <Field label="Relationship" value={contactForm.relationship} onChange={(v) => setContactForm((f) => ({ ...f, relationship: v }))} placeholder="Spouse, Brother…" required />
              </div>
              <div className="mb-3">
                <Field label="Phone Number" value={contactForm.phone} onChange={(v) => setContactForm((f) => ({ ...f, phone: v }))} placeholder="+91 98765 43210" type="tel" required />
              </div>
              <label className="flex items-center gap-2 mb-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contactForm.isPrimary}
                  onChange={(e) => setContactForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                  className="w-4 h-4 accent-nfc-red"
                />
                <span className="text-sm font-medium text-nfc-dark">Set as primary contact (shown first, with call animation)</span>
              </label>
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-nfc-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors">
                  {editingContact ? "Update" : "Add Contact"}
                </button>
                <button type="button" onClick={() => { setShowContactForm(false); setEditingContact(null); }} className="px-4 py-2 bg-nfc-outer text-nfc-dark rounded-lg text-sm font-bold hover:bg-nfc-border transition-colors">
                  Cancel
                </button>
              </div>
            </form>
          )}
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
