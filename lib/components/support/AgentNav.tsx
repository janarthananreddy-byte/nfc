"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export function AgentNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const links = [
    { href: "/agent", label: "Dashboard" },
    { href: "/agent/tickets", label: "Tickets" },
    { href: "/agent/reports", label: "Reports" },
    ...(isAdmin ? [
      { href: "/agent/categories", label: "Categories" },
      { href: "/agent/statuses", label: "Statuses" },
      { href: "/agent/templates", label: "Templates" },
    ] : []),
  ];
  return (
    <header style={{ backgroundColor: "#012963" }}>
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/agent" className="font-extrabold text-white tracking-tight">Agent<span className="text-nfc-red"> Console</span></Link>
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${pathname === l.href ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}>{l.label}</Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-white/50 hidden sm:block">{session?.user?.email}</span>
          <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-white/60 hover:text-white transition-colors">Sign out</button>
        </div>
      </div>
    </header>
  );
}
