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
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then(setData);
  }, []);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then((d) => {
      if (d.tapsToday !== undefined) setTapCount(d.tapsToday);
    }).catch(() => {});
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
          <ActionCard
            href="/shipping"
            icon={<TruckIcon />}
            title="Shipping Address"
            desc="Enter where to ship your physical NFC tag"
            cta="Add address →"
          />
          {data?.tag && (
            <ActionCard
              href={`/tag/${data.tag.tagSlug}`}
              icon={<NfcIcon />}
              title="View My Card"
              desc="See exactly what rescuers see when they scan your tag"
              cta="View card →"
              external
            />
          )}
        </div>
      </main>
    </>
  );
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
function TruckIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11900" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
}
function NfcIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e11900" strokeWidth="2"><path d="M6 15a6 6 0 1 0 12 0 6 6 0 0 0-12 0z"/><path d="M12 12v3l2 1"/></svg>;
}
