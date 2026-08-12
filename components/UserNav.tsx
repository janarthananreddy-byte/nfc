"use client";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useIdleRemaining } from "@/components/IdleProvider";
import { LOGO_SRC } from "@/components/brand";

export function UserNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const remaining = useIdleRemaining();

  const links = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/orders", label: "My Orders" },
    { href: "/contact", label: "Contact Us" },
  ];

  return (
    <header className="bg-nfc-dark border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img src={LOGO_SRC} alt="Emergency Call" className="w-9 h-9 object-contain" />
          <span className="font-bold text-white tracking-tight" style={{ fontFamily: "Archivo, sans-serif" }}>
            Emergency<span className="text-nfc-red"> Call</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === l.href ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {remaining != null && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-white/45 px-2 py-1 rounded-lg bg-white/5" style={{ fontFamily: "Space Mono, monospace" }} title="Auto-logout after inactivity">
              <span className={remaining <= 60 ? "text-nfc-red" : ""}>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span>
            </span>
          )}
          <span className="text-xs text-white/40 hidden sm:block">{session?.user.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="text-sm text-white/60 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
