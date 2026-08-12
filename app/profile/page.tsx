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
  mobile: string;
  cyclingType: string;
  clubName: string;
  clubId: string;
  clubContactName: string;
  clubContactPhone: string;
  clubContactEmail: string;
  bloodType: string;
  photoUrl: string;
}

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const CYCLING_TYPES = ["Road cyclist", "Mountain biker", "Track cyclist", "Triathlete", "BMX rider", "Gravel rider", "Touring cyclist"];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    firstName: "", lastName: "", age: "", mobile: "", cyclingType: "Road cyclist",
    clubName: "", clubId: "", clubContactName: "", clubContactPhone: "", clubContactEmail: "",
    bloodType: "", photoUrl: "",
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", relationship: "", phone: "", isPrimary: false });
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((d) => {
      if (d.profile) {
        setProfile({
          firstName: d.profile.firstName || "",
          lastName: d.profile.lastName || "",
          age: d.profile.age ? String(d.profile.age) : "",
          mobile: d.profile.mobile || "",
          cyclingType: d.profile.cyclingType || "Road cyclist",
          clubName: d.profile.clubName || "",
          clubId: d.profile.clubId || "",
          clubContactName: d.profile.clubContactName || "",
          clubContactPhone: d.profile.clubContactPhone || "",
          clubContactEmail: d.profile.clubContactEmail || "",
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
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Your Profile</h1>
            <p className="text-nfc-muted text-sm mt-1">This information appears on your emergency card when your NFC tag is scanned</p>
          </div>
          <button
            onClick={() => setShowPreview(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-nfc-dark text-white text-sm font-bold rounded-xl hover:bg-nfc-dark/80 transition-colors"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            Preview Card
          </button>
        </div>

        {/* Profile Form */}
        <form onSubmit={saveProfile} className="bg-white rounded-2xl border border-nfc-border p-6 mb-6">
          <h2 className="font-bold text-nfc-dark mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-nfc-red text-white text-xs flex items-center justify-center font-black">1</span>
            Profile information
          </h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="First Name" value={profile.firstName} onChange={(v) => setProfile((p) => ({ ...p, firstName: v }))} placeholder="Marco" required />
            <Field label="Last Name" value={profile.lastName} onChange={(v) => setProfile((p) => ({ ...p, lastName: v }))} placeholder="Reyes" required />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Age" type="number" value={profile.age} onChange={(v) => setProfile((p) => ({ ...p, age: v }))} placeholder="38" />
            <Field label="Mobile Number" type="tel" value={profile.mobile} onChange={(v) => setProfile((p) => ({ ...p, mobile: v }))} placeholder="+91 98765 43210" required />
          </div>

          {/* Club details */}
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

        {/* Club Contact */}
        <div className="bg-white rounded-2xl border border-nfc-border p-6 mb-6">
          <h2 className="font-bold text-nfc-dark mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-nfc-red text-white text-xs flex items-center justify-center font-black">2</span>
            Club Contact
          </h2>
          <p className="text-nfc-muted text-xs mb-4">Club representative to contact in case of an emergency during a club ride.</p>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Field label="Contact Name" value={profile.clubContactName} onChange={(v) => setProfile((p) => ({ ...p, clubContactName: v }))} placeholder="Club Secretary" />
            <Field label="Contact Phone" type="tel" value={profile.clubContactPhone} onChange={(v) => setProfile((p) => ({ ...p, clubContactPhone: v }))} placeholder="+91 98765 43210" />
          </div>
          <div className="mb-4">
            <Field label="Contact Email" type="email" value={profile.clubContactEmail} onChange={(v) => setProfile((p) => ({ ...p, clubContactEmail: v }))} placeholder="contact@club.com" />
          </div>
          <button
            onClick={saveProfile}
            disabled={saving}
            className="w-full bg-nfc-dark text-white font-bold py-3 rounded-xl hover:bg-nfc-dark/80 transition-colors disabled:opacity-60 text-sm"
          >
            {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Club Contact"}
          </button>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-2xl border border-nfc-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-nfc-dark flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-nfc-red text-white text-xs flex items-center justify-center font-black">3</span>
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

      {/* Preview Modal */}
      {showPreview && (
        <CardPreviewModal
          profile={profile}
          contacts={contacts}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
}

function CardPreviewModal({ profile, contacts, onClose }: { profile: ProfileData; contacts: Contact[]; onClose: () => void }) {
  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || "Cyclist";
  const primaryContact = contacts.find((c) => c.isPrimary);
  const otherContacts = contacts.filter((c) => !c.isPrimary);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-8 px-4"
      style={{ background: "rgba(22,20,15,0.72)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm">
        {/* Close + label */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-nfc-red animate-scanpulse inline-block"></span>
            <span className="text-xs font-bold text-white/70" style={{ fontFamily: "Space Mono, monospace", letterSpacing: "0.1em" }}>CARD PREVIEW</span>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Phone frame */}
        <div style={{ position: "relative", width: "100%", background: "#faf9f7", borderRadius: "46px", boxShadow: "0 24px 60px rgba(0,0,0,.4)", overflow: "hidden", border: "1px solid #e7e4df" }}>
          {/* Notch */}
          <div style={{ position: "absolute", top: "14px", left: "50%", transform: "translateX(-50%)", width: "118px", height: "30px", background: "#111", borderRadius: "18px", zIndex: 5 }}></div>

          {/* Status bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 28px 6px", font: "600 14px 'Inter',sans-serif", color: "#16140f", position: "relative", zIndex: 4 }}>
            <span>{new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false })}</span>
            <span style={{ font: "700 11px 'Space Mono',monospace", letterSpacing: ".1em", color: "#e11900" }}>TAG SCANNED</span>
          </div>

          {/* Red alert header */}
          <div style={{ background: "#e11900", padding: "14px 24px 28px", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", font: "700 12px 'Space Mono',monospace", letterSpacing: ".18em" }}>
              <span className="animate-scanpulse" style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#fff", display: "inline-block" }}></span>
              EMERGENCY CONTACT DETAILS
            </div>
          </div>

          {/* Identity */}
          <div style={{ padding: "0 24px", marginTop: "-22px", display: "flex", alignItems: "flex-end", gap: "16px" }}>
            <div style={{ width: "96px", height: "96px", borderRadius: "20px", flex: "none", border: "4px solid #faf9f7", boxShadow: "0 6px 18px rgba(0,0,0,.18)", background: profile.photoUrl ? "none" : "repeating-linear-gradient(135deg,#e6e2db 0 8px,#dcd7cf 8px 16px)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", overflow: "hidden" }}>
              {profile.photoUrl ? (
                <img src={profile.photoUrl} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ font: "700 8px 'Space Mono',monospace", color: "#8a857c", letterSpacing: ".05em" }}>CYCLIST<br />PHOTO</span>
              )}
            </div>
            <div style={{ paddingBottom: "6px" }}>
              <div style={{ font: "800 22px/1 'Inter',sans-serif", color: "#16140f", letterSpacing: "-.02em" }}>{fullName}</div>
              <div style={{ marginTop: "5px", font: "500 13px 'Inter',sans-serif", color: "#6b6660" }}>
                {profile.age ? `Age ${profile.age}` : ""}
              </div>
              {(profile.clubName || profile.clubId) && (
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {profile.clubName && <span style={{ font: "700 11px 'Inter',sans-serif", color: "#16140f" }}>{profile.clubName}</span>}
                  {profile.clubId && <span style={{ font: "700 10px 'Space Mono',monospace", color: "#e11900", background: "#fdece9", padding: "2px 8px", borderRadius: "6px", letterSpacing: ".06em" }}>{profile.clubId}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Blood type */}
          {profile.bloodType && (
            <div style={{ margin: "18px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", border: "2px solid #e11900", borderRadius: "18px", background: "#fff" }}>
              <div style={{ font: "700 11px 'Space Mono',monospace", letterSpacing: ".14em", color: "#e11900" }}>BLOOD TYPE</div>
              <div style={{ font: "900 32px 'Inter',sans-serif", color: "#16140f", lineHeight: 1 }}>
                {profile.bloodType.replace("+", "").replace("-", "")}<span style={{ color: "#e11900" }}>{profile.bloodType.includes("+") ? "+" : profile.bloodType.includes("-") ? "-" : ""}</span>
              </div>
            </div>
          )}

          {/* Club Contact */}
          {(profile.clubContactName || profile.clubContactPhone) && (
            <div style={{ margin: "14px 24px 0", padding: "14px 18px", border: "1.5px solid #e7e4df", borderRadius: "18px", background: "#fff" }}>
              <div style={{ font: "700 10px 'Space Mono',monospace", letterSpacing: ".14em", color: "#6b6660", marginBottom: "8px" }}>CLUB CONTACT</div>
              {profile.clubContactName && <div style={{ font: "700 15px 'Inter',sans-serif", color: "#16140f" }}>{profile.clubContactName}</div>}
              {profile.clubContactPhone && (
                <a href={`tel:${profile.clubContactPhone}`} style={{ display: "block", font: "500 13px 'Space Mono',monospace", color: "#e11900", marginTop: "4px", textDecoration: "none" }}>{profile.clubContactPhone}</a>
              )}
              {profile.clubContactEmail && (
                <a href={`mailto:${profile.clubContactEmail}`} style={{ display: "block", font: "500 12px 'Inter',sans-serif", color: "#6b6660", marginTop: "2px", textDecoration: "none" }}>{profile.clubContactEmail}</a>
              )}
            </div>
          )}

          {/* Contacts */}
          <div style={{ padding: "20px 24px 28px" }}>
            <div style={{ font: "700 11px 'Space Mono',monospace", letterSpacing: ".14em", color: "#6b6660", marginBottom: "12px" }}>EMERGENCY CONTACTS</div>

            {primaryContact && (
              <div className="animate-ring" style={{ display: "flex", alignItems: "center", gap: "14px", background: "#e11900", borderRadius: "18px", padding: "14px 18px", marginBottom: "10px" }}>
                <span style={{ width: "42px", height: "42px", borderRadius: "50%", flex: "none", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PhoneIcon color="#fff" />
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", font: "700 16px 'Inter',sans-serif", color: "#fff" }}>{primaryContact.name}</span>
                  <span style={{ display: "block", font: "500 11px 'Space Mono',monospace", color: "rgba(255,255,255,.82)", marginTop: "2px" }}>{primaryContact.relationship.toUpperCase()} · PRIMARY</span>
                </span>
                <span style={{ font: "700 12px 'Space Mono',monospace", color: "#fff", letterSpacing: ".06em" }}>CALL</span>
              </div>
            )}

            {otherContacts.map((c) => (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "14px", background: "#fff", border: "1.5px solid #e7e4df", borderRadius: "18px", padding: "12px 18px", marginBottom: "10px" }}>
                <span style={{ width: "42px", height: "42px", borderRadius: "50%", flex: "none", background: "#fdece9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PhoneIcon color="#e11900" size={20} />
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", font: "700 16px 'Inter',sans-serif", color: "#16140f" }}>{c.name}</span>
                  <span style={{ display: "block", font: "500 11px 'Space Mono',monospace", color: "#8a857c", marginTop: "2px" }}>{c.relationship.toUpperCase()}</span>
                </span>
                <span style={{ font: "700 12px 'Space Mono',monospace", color: "#e11900", letterSpacing: ".06em" }}>CALL</span>
              </div>
            ))}

            {contacts.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "#8a857c", font: "500 13px 'Inter',sans-serif", border: "1.5px dashed #e7e4df", borderRadius: "14px" }}>
                No emergency contacts added yet
              </div>
            )}

            {/* Default services */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0 12px" }}>
              <div style={{ flex: 1, height: "1px", background: "#e7e4df" }}></div>
              <span style={{ font: "700 10px 'Space Mono',monospace", letterSpacing: ".12em", color: "#b0a99f" }}>DEFAULT</span>
              <div style={{ flex: 1, height: "1px", background: "#e7e4df" }}></div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "#16140f", borderRadius: "18px", padding: "14px 18px", marginBottom: "10px" }}>
              <span style={{ width: "42px", height: "42px", borderRadius: "50%", flex: "none", background: "rgba(225,29,0,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PhoneIcon color="#e11900" />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: "700 16px 'Inter',sans-serif", color: "#fff" }}>Emergency Services</span>
                <span style={{ display: "block", font: "500 11px 'Space Mono',monospace", color: "#8a857c", marginTop: "2px" }}>AMBULANCE · 108</span>
              </span>
              <span style={{ font: "900 20px 'Inter',sans-serif", color: "#e11900" }}>108</span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", background: "#16140f", borderRadius: "18px", padding: "14px 18px" }}>
              <span style={{ width: "42px", height: "42px", borderRadius: "50%", flex: "none", background: "rgba(225,29,0,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldIcon />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: "700 16px 'Inter',sans-serif", color: "#fff" }}>Police</span>
                <span style={{ display: "block", font: "500 11px 'Space Mono',monospace", color: "#8a857c", marginTop: "2px" }}>POLICE · 100</span>
              </span>
              <span style={{ font: "900 20px 'Inter',sans-serif", color: "#e11900" }}>100</span>
            </div>
          </div>
        </div>

        <p className="text-center text-white/40 text-xs mt-4" style={{ fontFamily: "Space Mono, monospace" }}>
          Save your profile to update the live card
        </p>
      </div>
    </div>
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

function PhoneIcon({ color = "#fff", size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
