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

const COLUMNS = [
  { key: "payment_review", label: "Payment review", accent: "bg-amber-400" },
  { key: "confirmed", label: "Confirmed", accent: "bg-blue-400" },
  { key: "shipped", label: "Shipped", accent: "bg-indigo-400" },
  { key: "delivered", label: "Delivered", accent: "bg-green-500" },
  { key: "cancelled", label: "Cancelled", accent: "bg-red-400" },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/orders").then((r) => r.json()).then((d) => setOrders(Array.isArray(d) ? d : [])).catch(() => setOrders([]));
  }
  useEffect(load, []);

  async function setStatus(orderId: string, status: string) {
    setOrders((prev) => prev ? prev.map((o) => o.id === orderId ? { ...o, status } : o) : prev);
    await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status }) });
  }

  function onDrop(status: string) {
    if (dragId) {
      const o = orders?.find((x) => x.id === dragId);
      if (o && o.status !== status) setStatus(dragId, status);
    }
    setDragId(null);
    setOverCol(null);
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
    <div class="to">${esc(o.fullName)}<br>${esc(o.address1)}${o.address2 ? "<br>" + esc(o.address2) : ""}<br>${esc(o.city)}, ${esc(o.state)} ${esc(o.zipCode)}<br>${esc(o.country)}${o.phone ? "<br>Tel " + esc(o.phone) : ""}</div>
  </div>
  <div class="row"><span>NFC Tag x ${o.quantity}</span><span>Rs ${o.totalAmount}</span></div>
  <div class="foot">Order date: ${new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</div>
</div>
<button class="noprint" style="margin-top:16px;padding:10px 20px;font-size:14px;font-weight:bold;cursor:pointer;" onclick="window.print()">Print label</button>
</body></html>`);
    w.document.close();
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Orders</h1>
          <p className="text-nfc-muted text-sm mt-1">Drag a card between columns to update its status</p>
        </div>
        <button onClick={load} title="Refresh" className="px-4 py-2 bg-white border border-nfc-border rounded-xl text-sm font-bold text-nfc-dark hover:bg-nfc-outer transition-colors">Refresh</button>
      </div>

      {orders === null ? (
        <p className="text-nfc-muted text-sm">Loading...</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const items = orders.filter((o) => o.status === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
                onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
                onDrop={() => onDrop(col.key)}
                className={`shrink-0 w-72 rounded-2xl border p-3 transition-colors ${overCol === col.key ? "border-nfc-red bg-nfc-red-light/40" : "border-nfc-border bg-nfc-outer/40"}`}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.accent}`}></span>
                    <span className="text-sm font-bold text-nfc-dark">{col.label}</span>
                  </div>
                  <span className="text-xs font-bold text-nfc-muted bg-white border border-nfc-border rounded-full px-2 py-0.5">{items.length}</span>
                </div>

                <div className="space-y-2 min-h-[60px]">
                  {items.map((o) => (
                    <div
                      key={o.id}
                      draggable
                      onDragStart={() => setDragId(o.id)}
                      onDragEnd={() => { setDragId(null); setOverCol(null); }}
                      className={`bg-white rounded-xl border border-nfc-border p-3 cursor-grab active:cursor-grabbing shadow-sm ${dragId === o.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-nfc-dark" style={{ fontFamily: "Space Mono, monospace" }}>#{o.orderNo || o.id.slice(-8).toUpperCase()}</span>
                        <span className="text-xs font-extrabold text-nfc-red">Rs {o.totalAmount}</span>
                      </div>
                      <p className="text-sm font-medium text-nfc-dark mt-1 truncate">{o.email}</p>
                      <p className="text-xs text-nfc-muted mt-0.5">NFC Tag x {o.quantity} - {o.fullName}, {o.city}</p>
                      <p className="text-xs text-nfc-subtle mt-1" style={{ fontFamily: "Space Mono, monospace" }}>UPI: {o.upiTxnId || "-"}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-nfc-border/60">
                        <span className="text-[11px] text-nfc-subtle">{new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        <button onClick={() => printLabel(o)} className="text-[11px] font-bold text-nfc-dark hover:text-nfc-red transition-colors">Label</button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-xs text-nfc-subtle text-center py-4">Drop here</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
