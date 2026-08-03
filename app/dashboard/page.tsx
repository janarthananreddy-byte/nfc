"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { UserNav } from "@/components/UserNav";

interface DashboardData {
  profile: {
    firstName: string;
    lastName: string;
    bloodType: string;
    cyclingType: string;
    clubName: string;
    clubId: string;
    contacts: { id: string; name: string; relationship: string; phone: string; isPrimary: boolean }[];
  } | null;
  tag: { tagSlug: string; isActive: boolean } | null;
  tapCount?: number;
  taps?: { id: string; tappedAt: string; ipAddress: string; userAgent: string; latitude: string; longitude: string }[];
  callCount?: number;
  callStats?: { contactName: string; relationship: string; phone: string; count: number; lastAt: string }[];
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tapPage, setTapPage] = useState(1);
  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setData);
  }, []);

  const tagUrl = data?.tag ? `${window.location.origin}/tag/${data.tag.tagSlug}` : "";
  const profileComplete = data?.profile && data.profile.firstName && data.profile.bloodType && (data.profile.contacts?.length ?? 0) > 0;

  return (
    <>
      <UserNav />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">
            Hello, {data?.profile?.firstName || session?.user.email?.split("@")[0]} 👋
          </h1>
          <p className="text-nfc-muted text-sm mt-1">Manage your emergency contact card</p>
        </div>

        {!profileComplete && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Profile incomplete</p>
              <p className="text-amber-700 text-sm mt-0.5">Add your blood type and emergency contacts so your card is ready.</p>
              <Link href="/profile" className="inline-block mt-2 text-sm font-bold text-amber-700 underline">Complete profile →</Link>
            </div>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard label="CONTACTS" value={String(data?.profile?.contacts?.length ?? 0)} sub="Emergency contacts" />
          <StatCard label="BLOOD TYPE" value={data?.profile?.bloodType || "—"} sub="Shown on your card" red />
          <StatCard label="TAG STATUS" value={data?.tag?.isActive ? "ACTIVE" : "INACTIVE"} sub={data?.tag?.isActive ? "Card is live" : "Tag is disabled"} />
        </div>

        {/* NFC Tag Card */}
        {data?.tag && (
          <div className="bg-nfc-dark rounded-2xl p-5 mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-1" style={{ fontFamily: "Space Mono, monospace" }}>Your NFC Card URL</p>
                <p className="text-sm text-white/80 font-mono break-all">{tagUrl}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link
                  href={`/tag/${data.tag.tagSlug}`}
                  target="_blank"
                  className="px-4 py-2 bg-nfc-red text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
                >
                  Preview Card
                </Link>
                <button
                  onClick={() => navigator.clipboard.writeText(tagUrl)}
                  className="px-4 py-2 bg-white/10 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-colors"
                >
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ActionCard
            href="/profile"
            icon={<UserIcon />}
            title="Edit Profile"
            desc="Update your cyclist info and emergency contacts"
            cta="Edit →"
          />
          <div className="bg-white rounded-2xl border border-nfc-border p-5">
            <div className="w-10 h-10 rounded-xl bg-nfc-red-light flex items-center justify-center mb-3"><TapIcon /></div>
            <p className="text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1" style={{ fontFamily: "Space Mono, monospace" }}>TAPPED</p>
            <p className="text-3xl font-extrabold text-nfc-dark">{data?.tapCount ?? 0}</p>
            <p className="text-xs text-nfc-subtle mt-1">Times your tag was scanned by others</p>
          </div>
          <ActionCard
            href="/order"
            icon={<CartIcon />}
            title="Order My Tag"
            desc="Buy your physical NFC Emergency tag and get it shipped"
            cta="Order now →"
          />
        </div>

        {/* Tag Tap Activity */}
        <div className="bg-white rounded-2xl border border-nfc-border p-6 mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-nfc-dark flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-nfc-dark text-white text-xs flex items-center justify-center font-black">T</span>
              Tag Tap Activity
            </h2>
            <span className="text-xs font-bold text-nfc-red">{(data?.taps?.length ?? 0)} recent</span>
          </div>
          <p className="text-nfc-muted text-xs mb-4">Every time someone scans your NFC tag, the scan is logged here.</p>
          {(data?.taps?.length ?? 0) === 0 ? (
            <p className="text-sm text-nfc-subtle text-center py-4">No taps recorded yet.</p>
          ) : (
            <>
              <div className="divide-y divide-nfc-border/50">
                <div className="flex items-center gap-3 py-2 text-[11px] font-bold text-nfc-muted uppercase tracking-wide border-b-2 border-nfc-border" style={{ fontFamily: "Space Mono, monospace" }}>
                  <span className="flex-1">When</span>
                  <span className="w-16">Device</span>
                  <span className="w-28">IP</span>
                  <span className="w-24 text-right">Location</span>
                </div>
                {(data!.taps!).slice((tapPage - 1) * 10, tapPage * 10).map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-1.5 text-xs">
                    <span className="flex-1 text-nfc-dark whitespace-nowrap">{new Date(t.tappedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    <span className="w-16 text-nfc-muted truncate">{deviceLabel(t.userAgent)}</span>
                    <span className="w-28 font-mono text-nfc-subtle truncate">{t.ipAddress || "-"}</span>
                    <span className="w-24 text-right truncate">{t.latitude && t.longitude ? <a href={`https://maps.google.com/?q=${t.latitude},${t.longitude}`} target="_blank" className="text-nfc-red underline">{Number(t.latitude).toFixed(2)}, {Number(t.longitude).toFixed(2)}</a> : <span className="text-nfc-subtle">-</span>}</span>
                  </div>
                ))}
              </div>
              {data!.taps!.length > 10 && (
                <div className="flex items-center justify-between pt-3 mt-1 border-t border-nfc-border">
                  <span className="text-xs text-nfc-muted">Page {tapPage} of {Math.ceil(data!.taps!.length / 10)}</span>
                  <div className="flex gap-2">
                    <button onClick={() => setTapPage((p) => Math.max(1, p - 1))} disabled={tapPage === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-nfc-outer text-nfc-dark disabled:opacity-40 hover:bg-nfc-border transition-colors">Prev</button>
                    <button onClick={() => setTapPage((p) => Math.min(Math.ceil(data!.taps!.length / 10), p + 1))} disabled={tapPage >= Math.ceil(data!.taps!.length / 10)} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-nfc-outer text-nfc-dark disabled:opacity-40 hover:bg-nfc-border transition-colors">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        {/* Emergency Calls Made */}
        <div className="bg-white rounded-2xl border border-nfc-border p-6 mt-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-nfc-dark flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-nfc-dark text-white text-xs flex items-center justify-center font-black">C</span>
              Emergency Calls Made
            </h2>
            <span className="text-xs font-bold text-nfc-red">{data?.callCount ?? 0} total</span>
          </div>
          <p className="text-nfc-muted text-xs mb-4">Which of your contacts strangers have called from your scanned tag.</p>
          {(data?.callStats?.length ?? 0) === 0 ? (
            <p className="text-sm text-nfc-subtle text-center py-4">No calls yet.</p>
          ) : (
            <div className="divide-y divide-nfc-border/50">
              <div className="flex items-center gap-3 py-2 text-[11px] font-bold text-nfc-muted uppercase tracking-wide border-b-2 border-nfc-border" style={{ fontFamily: "Space Mono, monospace" }}>
                <span className="flex-1">Contact</span>
                <span className="w-32">Number</span>
                <span className="w-28">Last called</span>
                <span className="w-12 text-right">Times</span>
              </div>
              {data!.callStats!.map((c, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 text-xs">
                  <span className="flex-1 text-nfc-dark truncate">{c.contactName || "-"}{c.relationship ? ` (${c.relationship})` : ""}</span>
                  <span className="w-32 font-mono text-nfc-subtle truncate">{c.phone || "-"}</span>
                  <span className="w-28 text-nfc-muted truncate">{c.lastAt ? new Date(c.lastAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-"}</span>
                  <span className="w-12 text-right font-bold text-nfc-red">{c.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function deviceLabel(ua: string) {
  const s = String(ua || "");
  if (/iPhone|iPad|iOS/i.test(s)) return "iOS";
  if (/Android/i.test(s)) return "Android";
  if (/Windows/i.test(s)) return "Windows";
  if (/Macintosh|Mac OS/i.test(s)) return "Mac";
  if (/Linux/i.test(s)) return "Linux";
  return s ? "Other" : "Unknown";
}

function StatCard({ label, value, sub, red }: { label: string; value: string; sub: string; red?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-nfc-border p-4">
      <p className="text-xs font-bold text-nfc-muted uppercase tracking-widest mb-2" style={{ fontFamily: "Space Mono, monospace" }}>{label}</p>
      <p className={`text-2xl font-extrabold ${red ? "text-nfc-red" : "text-nfc-dark"}`}>{value}</p>
      <p className="text-xs text-nfc-subtle mt-1">{sub}</p>
    </div>
  );
}

function ActionCard({ href, icon, title, desc, cta, external }: { href: string; icon: React.ReactNode; title: string; desc: string; cta: string; external?: boolean }) {
  return (
    <Link href={href} target={external ? "_blank" : undefined} className="bg-white rounded-2xl border border-nfc-border p-5 hover:border-nfc-red/40 hover:shadow-sm transition-all group">
      <div className="w-10 h-10 rounded-xl bg-nfc-red-light flex items-center justify-center mb-3">{icon}</div>
      <h3 className="font-bold text-nfc-dark text-sm mb-1">{title}</h3>
      <p className="text-xs text-nfc-muted leading-relaxed mb-3">{desc}</p>
      <span className="text-xs font-bold text-nfc-red group-hover:underline">{cta}</span>
    </Link>
  );
}

function UserIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11900" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function TapIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11900" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>;
}
function CartIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11900" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
}
