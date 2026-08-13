"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { fmtDate } from "@/components/support/badges";

interface N { id: string; title: string; body: string; read: boolean; createdAt: string; ticketId: string | null }

export default function NotificationsPage() {
  const [items, setItems] = useState<N[]>([]);
  const load = () => fetch("/api/notifications").then((r) => r.json()).then((d) => setItems(d.items || []));
  useEffect(() => { load(); }, []);
  async function markAll() { await fetch("/api/notifications", { method: "POST" }); load(); }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-extrabold text-nfc-dark">Notifications</h1><button onClick={markAll} className="text-sm text-nfc-red font-bold hover:underline">Mark all read</button></div>
      <div className="bg-white rounded-2xl border border-nfc-border overflow-hidden">
        {items.length === 0 ? <p className="px-5 py-10 text-center text-nfc-muted text-sm">You're all caught up.</p> :
          <ul className="divide-y divide-nfc-border/60">{items.map((n) => {
            const inner = <div className={`px-5 py-4 ${n.read ? "" : "bg-nfc-red-light/40"}`}>
              <div className="flex items-start gap-3">{!n.read && <span className="w-2 h-2 rounded-full bg-nfc-red mt-1.5 shrink-0" />}
                <div><p className="text-sm font-bold text-nfc-dark">{n.title}</p>{n.body && <p className="text-sm text-nfc-muted mt-0.5">{n.body}</p>}<p className="text-xs text-nfc-subtle mt-1">{fmtDate(n.createdAt)}</p></div>
              </div></div>;
            return <li key={n.id}>{n.ticketId ? <Link href={`/support/tickets/${n.ticketId}`}>{inner}</Link> : inner}</li>;
          })}</ul>}
      </div>
    </div>
  );
}
