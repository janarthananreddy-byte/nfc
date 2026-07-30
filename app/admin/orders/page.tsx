"use client";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  email: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  fullName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  status: string;
  upiTxnId: string;
  createdAt: string;
}

const STATUSES = ["payment_review", "confirmed", "shipped", "delivered", "cancelled"];
const LABEL: Record<string, string> = {
  payment_review: "Payment review",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  function load() {
    fetch("/api/admin/orders").then((r) => r.json()).then((d) => setOrders(Array.isArray(d) ? d : [])).catch(() => setOrders([]));
  }
  useEffect(load, []);

  async function setStatus(orderId: string, status: string) {
    setOrders((prev) => prev ? prev.map((o) => o.id === orderId ? { ...o, status } : o) : prev);
    await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status }) });
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Orders</h1>
        <p className="text-nfc-muted text-sm mt-1">Review payments and update order status</p>
      </div>

      {orders === null ? (
        <p className="text-nfc-muted text-sm">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-nfc-border p-10 text-center text-nfc-muted text-sm">No orders yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="bg-white rounded-2xl border border-nfc-border p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-bold text-nfc-dark text-sm">{o.email}</p>
                  <p className="text-xs text-nfc-subtle mt-0.5" style={{ fontFamily: "Space Mono, monospace" }}>#{o.id.slice(-8).toUpperCase()} · {new Date(o.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="px-3 py-1.5 rounded-lg border border-nfc-border text-sm font-medium text-nfc-dark bg-white focus:border-nfc-red focus:outline-none">
                  {STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-sm">
                <div>
                  <p className="text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1" style={{ fontFamily: "Space Mono, monospace" }}>Item</p>
                  <p className="text-nfc-dark">NFC Tag × {o.quantity}</p>
                  <p className="font-extrabold text-nfc-dark">₹{o.totalAmount}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1" style={{ fontFamily: "Space Mono, monospace" }}>UPI Txn ID</p>
                  <p className="font-mono text-nfc-dark break-all">{o.upiTxnId || "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1" style={{ fontFamily: "Space Mono, monospace" }}>Ship to</p>
                  <p className="text-nfc-dark leading-relaxed">{o.fullName}, {o.address1}{o.address2 ? `, ${o.address2}` : ""}, {o.city}, {o.state} {o.zipCode}, {o.country}{o.phone ? ` · ${o.phone}` : ""}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
