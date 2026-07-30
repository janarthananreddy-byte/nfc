"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserNav } from "@/components/UserNav";

interface Order {
  id: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  status: string;
  upiTxnId: string;
  createdAt: string;
}

const STATUS_LABEL: Record<string, string> = {
  payment_review: "Payment under review",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const STATUS_STYLE: Record<string, string> = {
  payment_review: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  delivered: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
};

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    fetch("/api/orders").then((r) => r.json()).then((d) => setOrders(Array.isArray(d) ? d : [])).catch(() => setOrders([]));
  }, []);

  return (
    <>
      <UserNav />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">My Orders</h1>
            <p className="text-nfc-muted text-sm mt-1">Track your NFC tag orders and payment status</p>
          </div>
          <Link href="/order" className="px-4 py-2 bg-nfc-red text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">Order My Tag</Link>
        </div>

        {orders === null ? (
          <p className="text-nfc-muted text-sm">Loading…</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-nfc-border p-10 text-center">
            <p className="text-nfc-dark font-bold mb-1">No orders yet</p>
            <p className="text-nfc-muted text-sm mb-4">Order your physical NFC Emergency tag to get started.</p>
            <Link href="/order" className="inline-block px-5 py-2.5 bg-nfc-red text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">Order My Tag</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-nfc-border p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="font-bold text-nfc-dark text-sm">NFC Emergency Tag × {o.quantity}</p>
                    <p className="text-xs text-nfc-subtle mt-0.5" style={{ fontFamily: "Space Mono, monospace" }}>#{o.id.slice(-8).toUpperCase()} · {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[o.status] || "bg-nfc-outer text-nfc-muted border-nfc-border"}`}>{STATUS_LABEL[o.status] || o.status}</span>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-nfc-border text-sm">
                  <span className="text-nfc-muted">UPI Txn: <span className="font-mono text-nfc-dark">{o.upiTxnId || "—"}</span></span>
                  <span className="font-extrabold text-nfc-dark">₹{o.totalAmount}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
