"use client";
import { useEffect, useState } from "react";

interface Order {
  id: string;
  orderNo: string;
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

  function esc(v: string) {
    return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function printLabel(o: Order) {
    const no = o.orderNo || o.id.slice(-8).toUpperCase();
    const w = window.open("", "_blank", "width=420,height=620");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Shipping Label ${esc(no)}</title>
<style>
  *{box-sizing:border-box;font-family:Arial,Helvetica,sans-serif;}
  body{margin:0;padding:24px;color:#111;}
  .label{border:2px solid #111;border-radius:12px;padding:20px;max-width:360px;}
  .brand{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #111;padding-bottom:10px;margin-bottom:12px;}
  .brand h2{margin:0;font-size:16px;}
  .no{font-family:monospace;font-size:14px;font-weight:bold;}
  .sec{margin-top:12px;}
  .k{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:3px;}
  .to{font-size:15px;line-height:1.5;font-weight:bold;}
  .row{display:flex;justify-content:space-between;font-size:13px;margin-top:6px;}
  .foot{margin-top:16px;font-size:11px;color:#666;border-top:1px dashed #999;padding-top:8px;}
  @media print{.noprint{display:none;}}
</style></head><body>
<div class="label">
  <div class="brand"><h2>NFC Emergency ID</h2><span class="no">#${esc(no)}</span></div>
  <div class="sec"><div class="k">Ship To</div>
    <div class="to">${esc(o.fullName)}<br>${esc(o.address1)}${o.address2 ? "<br>" + esc(o.address2) : ""}<br>${esc(o.city)}, ${esc(o.state)} ${esc(o.zipCode)}<br>${esc(o.country)}${o.phone ? "<br>☎ " + esc(o.phone) : ""}</div>
  </div>
  <div class="row"><span>NFC Tag × ${o.quantity}</span><span>₹${o.totalAmount}</span></div>
  <div class="foot">Order date: ${new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
</div>
<button class="noprint" style="margin-top:16px;padding:10px 20px;font-size:14px;font-weight:bold;cursor:pointer;" onclick="window.print()">Print label</button>
</body></html>`);
    w.document.close();
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Orders</h1>
          <p className="text-nfc-muted text-sm mt-1">Review payments and update order status</p>
        </div>
        <button onClick={load} title="Refresh" className="px-4 py-2 bg-white border border-nfc-border rounded-xl text-sm font-bold text-nfc-dark hover:bg-nfc-outer transition-colors">↻ Refresh</button>
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
                  <p className="text-xs text-nfc-subtle mt-0.5" style={{ fontFamily: "Space Mono, monospace" }}>#{o.orderNo || o.id.slice(-8).toUpperCase()} · {new Date(o.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => printLabel(o)} className="px-3 py-1.5 rounded-lg border border-nfc-border text-sm font-bold text-nfc-dark bg-white hover:bg-nfc-outer transition-colors">Shipping label</button>
                  <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="px-3 py-1.5 rounded-lg border border-nfc-border text-sm font-medium text-nfc-dark bg-white focus:border-nfc-red focus:outline-none">
                    {STATUSES.map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
                  </select>
                </div>
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
