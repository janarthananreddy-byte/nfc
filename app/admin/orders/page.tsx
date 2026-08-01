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
  trackingId: string;
  trackingUrl: string;
  createdAt: string;
}

const COLUMNS = [
  { key: "payment_review", label: "Payment review", accent: "bg-amber-400" },
  { key: "confirmed", label: "Confirmed", accent: "bg-blue-400" },
  { key: "shipped", label: "Shipped", accent: "bg-indigo-400" },
  { key: "delivered", label: "Delivered", accent: "bg-green-500" },
  { key: "cancelled", label: "Cancelled", accent: "bg-red-400" },
];

const STATUS_LABEL: Record<string, string> = {
  payment_review: "Payment review", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled",
};

function esc(v: string) {
  return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function fmtDate(d: string, withTime = false) {
  const opts: Intl.DateTimeFormatOptions = withTime
    ? { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }
    : { day: "numeric", month: "short", year: "numeric" };
  return new Date(d).toLocaleDateString("en-IN", opts);
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
  <div class="foot">Order date: ${fmtDate(o.createdAt)}</div>
</div>
<button class="noprint" style="margin-top:16px;padding:10px 20px;font-size:14px;font-weight:bold;cursor:pointer;" onclick="window.print()">Print label</button>
</body></html>`);
  w.document.close();
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);

  function load() {
    fetch("/api/admin/orders").then((r) => r.json()).then((d) => setOrders(Array.isArray(d) ? d : [])).catch(() => setOrders([]));
  }
  useEffect(load, []);

  async function setStatus(orderId: string, status: string) {
    setOrders((prev) => prev ? prev.map((o) => o.id === orderId ? { ...o, status } : o) : prev);
    setSelected((s) => s && s.id === orderId ? { ...s, status } : s);
    await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, status }) });
  }

  async function saveTracking(orderId: string, trackingId: string, trackingUrl: string) {
    setOrders((prev) => prev ? prev.map((o) => o.id === orderId ? { ...o, trackingId, trackingUrl } : o) : prev);
    setSelected((s) => s && s.id === orderId ? { ...s, trackingId, trackingUrl } : s);
    await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, trackingId, trackingUrl }) });
  }

  function onDrop(status: string) {
    if (dragId) {
      const o = orders?.find((x) => x.id === dragId);
      if (o && o.status !== status) setStatus(dragId, status);
    }
    setDragId(null);
    setOverCol(null);
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Orders</h1>
          <p className="text-nfc-muted text-sm mt-1">Drag a card between columns to update status, or click a card for full details</p>
        </div>
        <button onClick={load} title="Refresh" className="px-4 py-2 bg-white border border-nfc-border rounded-xl text-sm font-bold text-nfc-dark hover:bg-nfc-outer transition-colors">Refresh</button>
      </div>

      {orders === null ? (
        <p className="text-nfc-muted text-sm">Loading...</p>
      ) : (
        <div className="flex gap-0 overflow-x-auto pb-4 divide-x divide-nfc-border border border-nfc-border rounded-2xl bg-white">
          {COLUMNS.map((col) => {
            const items = orders.filter((o) => o.status === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => { e.preventDefault(); setOverCol(col.key); }}
                onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
                onDrop={() => onDrop(col.key)}
                className={`shrink-0 w-72 p-3 transition-colors ${overCol === col.key ? "bg-nfc-red-light/40" : "bg-nfc-outer/30"}`}
              >
                <div className="flex items-center justify-between mb-3 px-1 pb-2 border-b border-nfc-border">
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
                      onClick={() => setSelected(o)}
                      className={`bg-white rounded-xl border border-nfc-border p-3 cursor-pointer shadow-sm hover:border-nfc-red/50 transition-colors ${dragId === o.id ? "opacity-50" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-nfc-dark" style={{ fontFamily: "Space Mono, monospace" }}>#{o.orderNo || o.id.slice(-8).toUpperCase()}</span>
                        <span className="text-xs font-extrabold text-nfc-red">Rs {o.totalAmount}</span>
                      </div>
                      <p className="text-sm font-medium text-nfc-dark mt-1 truncate">{o.email}</p>
                      <p className="text-xs text-nfc-muted mt-0.5 truncate">{o.fullName}, {o.city}</p>
                      {(o.trackingId || o.trackingUrl) && (
                        <span className="inline-block mt-1 text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200 rounded px-1.5 py-0.5">Tracking added</span>
                      )}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-nfc-border/60">
                        <span className="text-[11px] text-nfc-subtle">{fmtDate(o.createdAt)}</span>
                        <span className="text-[11px] font-bold text-nfc-muted">Qty {o.quantity}</span>
                        <button onClick={(e) => { e.stopPropagation(); printLabel(o); }} className="text-[11px] font-bold text-nfc-dark hover:text-nfc-red transition-colors">Label</button>
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

      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onSetStatus={setStatus}
          onSaveTracking={saveTracking}
        />
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b border-nfc-border/50 text-sm">
      <span className="text-nfc-muted">{label}</span>
      <span className="text-nfc-dark font-medium text-right">{value}</span>
    </div>
  );
}

function OrderModal({ order, onClose, onSetStatus, onSaveTracking }: {
  order: Order;
  onClose: () => void;
  onSetStatus: (id: string, status: string) => void;
  onSaveTracking: (id: string, tid: string, turl: string) => Promise<void>;
}) {
  const [tid, setTid] = useState(order.trackingId || "");
  const [turl, setTurl] = useState(order.trackingUrl || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const no = order.orderNo || order.id.slice(-8).toUpperCase();

  async function save() {
    setSaving(true); setSaved(false);
    await onSaveTracking(order.id, tid.trim(), turl.trim());
    setSaving(false); setSaved(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-nfc-border w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-nfc-border sticky top-0 bg-white">
          <div>
            <h2 className="text-lg font-extrabold text-nfc-dark" style={{ fontFamily: "Space Mono, monospace" }}>#{no}</h2>
            <p className="text-xs text-nfc-muted">{fmtDate(order.createdAt, true)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-nfc-outer text-nfc-muted text-lg leading-none">x</button>
        </div>

        <div className="px-6 py-4">
          <Row label="Status" value={
            <select value={order.status} onChange={(e) => onSetStatus(order.id, e.target.value)} className="px-2 py-1 rounded-lg border border-nfc-border text-sm font-medium text-nfc-dark bg-white focus:border-nfc-red focus:outline-none">
              {COLUMNS.map((c) => <option key={c.key} value={c.key}>{STATUS_LABEL[c.key]}</option>)}
            </select>
          } />
          <Row label="Customer" value={order.email} />
          <Row label="Ship to" value={`${order.fullName}`} />
          <Row label="Address" value={`${order.address1}${order.address2 ? ", " + order.address2 : ""}, ${order.city}, ${order.state} ${order.zipCode}, ${order.country}`} />
          <Row label="Phone" value={order.phone || "-"} />
          <Row label="Item" value={`NFC Tag x ${order.quantity}`} />
          <Row label="Unit price" value={`Rs ${order.unitPrice}`} />
          <Row label="Total" value={<span className="font-extrabold text-nfc-red">Rs {order.totalAmount}</span>} />
          <Row label="UPI Txn ID" value={<span style={{ fontFamily: "Space Mono, monospace" }}>{order.upiTxnId || "-"}</span>} />
          <Row label="Order date" value={fmtDate(order.createdAt)} />

          <div className="mt-5">
            <h3 className="text-sm font-bold text-nfc-dark mb-2">Shipment tracking</h3>
            <label className="block text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1" style={{ fontFamily: "Space Mono, monospace" }}>Tracking ID</label>
            <input value={tid} onChange={(e) => { setTid(e.target.value); setSaved(false); }} placeholder="e.g. EX123456789IN" className="w-full px-3 py-2 rounded-lg border border-nfc-border text-sm text-nfc-dark focus:border-nfc-red focus:outline-none mb-3" />
            <label className="block text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1" style={{ fontFamily: "Space Mono, monospace" }}>Tracking URL</label>
            <input value={turl} onChange={(e) => { setTurl(e.target.value); setSaved(false); }} placeholder="https://track.courier.com/EX123456789IN" className="w-full px-3 py-2 rounded-lg border border-nfc-border text-sm text-nfc-dark focus:border-nfc-red focus:outline-none" />
            <div className="flex items-center gap-3 mt-3">
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-nfc-red text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50">{saving ? "Saving..." : "Save tracking"}</button>
              {order.trackingUrl && <a href={order.trackingUrl} target="_blank" className="text-sm text-nfc-red underline">Open link</a>}
              {saved && <span className="text-sm text-green-600 font-medium">Saved</span>}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button onClick={() => printLabel(order)} className="px-4 py-2 bg-nfc-dark text-white rounded-lg text-sm font-bold hover:bg-nfc-dark/80 transition-colors">Shipping label</button>
            <button onClick={onClose} className="px-4 py-2 bg-white border border-nfc-border rounded-lg text-sm font-bold text-nfc-dark hover:bg-nfc-outer transition-colors">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}
