"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export function SupportNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const load = () => fetch("/api/notifications").then((r) => r.json()).then((d) => setUnread(d.unread || 0)).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const links = [
    { href: "/support", label: "Dashboard" },
    { href: "/support/new", label: "Create Ticket" },
    { href: "/support/tickets", label: "My Tickets" },
    { href: "/support/kb", label: "Knowledge Base" },
  ];
  return (
    <header style={{ backgroundColor: "#012963" }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/support" className="font-extrabold text-white tracking-tight">Support<span className="text-nfc-red"> Desk</span></Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === l.href ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>{l.label}</Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/support/notifications" className="relative text-white/70 hover:text-white" title="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            {unread > 0 && <span className="absolute -top-1.5 -right-1.5 bg-nfc-red text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">{unread > 9 ? "9+" : unread}</span>}
          </Link>
          <span className="text-xs text-white/50 hidden sm:block">{session?.user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-white/60 hover:text-white transition-colors">Sign out</button>
        </div>
      </div>
    </header>
  );
}
