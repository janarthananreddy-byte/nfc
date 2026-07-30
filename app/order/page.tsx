"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { UserNav } from "@/components/UserNav";

interface Shipping {
  fullName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

const COUNTRIES = ["India", "United States", "United Kingdom", "Canada", "Australia", "Germany", "France", "Singapore", "UAE", "Other"];
const STEPS = ["Cart", "Shipping", "Review", "Payment"];

export default function OrderPage() {
  const [step, setStep] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);
  const [upiId, setUpiId] = useState("");
  const [payeeName, setPayeeName] = useState("NFC Emergency ID");
  const [shipping, setShipping] = useState<Shipping>({ fullName: "", address1: "", address2: "", city: "", state: "", zipCode: "", country: "India", phone: "" });
  const [txnId, setTxnId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then((r) => r.json()).then((d) => {
      setPrice(d.tagPrice || 0);
      setUpiId(d.upiId || "");
      setPayeeName(d.payeeName || "NFC Emergency ID");
    }).catch(() => {});
    fetch("/api/shipping").then((r) => r.json()).then((d) => {
      if (d && d.id) setShipping({ fullName: d.fullName, address1: d.address1, address2: d.address2 || "", city: d.city, state: d.state, zipCode: d.zipCode, country: d.country || "India", phone: d.phone || "" });
    }).catch(() => {});
  }, []);

  const total = price * quantity;

  function upd(field: keyof Shipping, val: string) {
    setShipping((s) => ({ ...s, [field]: val }));
  }

  function next() {
    setError("");
    if (step === 1) {
      if (!shipping.fullName || !shipping.address1 || !shipping.city || !shipping.state || !shipping.zipCode) {
        setError("Please fill all required shipping fields.");
        return;
      }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  }

  async function finish() {
    setError("");
    if (!txnId.trim()) { setError("Please enter the UPI transaction ID."); return; }
    setSubmitting(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity, shipping, upiTxnId: txnId.trim() }),
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Could not place order. Please try again.");
    }
  }

  const upiString = upiId ? `upi://pay?pa=${upiId}&pn=${encodeURIComponent(payeeName)}&am=${total}&cu=INR` : "";
  const qrSrc = upiId ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(upiString)}` : "";

  if (done) {
    return (
      <>
        <UserNav />
        <main className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight mb-2">Order placed!</h1>
          <p className="text-nfc-muted text-sm mb-6">Your payment will be reviewed and further order status you can find in My Orders.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/orders" className="px-5 py-2.5 bg-nfc-red text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">Go to My Orders</Link>
            <Link href="/dashboard" className="px-5 py-2.5 bg-white border border-nfc-border text-nfc-dark rounded-xl text-sm font-bold hover:border-nfc-red/40 transition-colors">Dashboard</Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <UserNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Order My Tag</h1>
          <p className="text-nfc-muted text-sm mt-1">Get your physical NFC Emergency ID tag delivered</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${i <= step ? "text-nfc-dark" : "text-nfc-subtle"}`}>
                <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${i < step ? "bg-green-500 text-white" : i === step ? "bg-nfc-red text-white" : "bg-nfc-border text-nfc-muted"}`}>{i < step ? "✓" : i + 1}</span>
                <span className="text-xs font-bold hidden sm:block">{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 rounded ${i < step ? "bg-green-500" : "bg-nfc-border"}`} />}
            </div>
          ))}
        </div>

        {error && <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 font-medium">{error}</div>}

        <div className="bg-white rounded-2xl border border-nfc-border p-6">
          {/* STEP 0: CART */}
          {step === 0 && (
            <div>
              <h2 className="font-bold text-nfc-dark mb-4">Your Cart</h2>
              <div className="flex items-center justify-between gap-4 py-4 border-b border-nfc-border">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-nfc-red-light flex items-center justify-center flex-shrink-0">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11900" strokeWidth="2"><path d="M6 15a6 6 0 1 0 12 0 6 6 0 0 0-12 0z"/><path d="M12 12v3l2 1"/></svg>
                  </div>
                  <div>
                    <p className="font-bold text-nfc-dark text-sm">NFC Emergency Tag</p>
                    <p className="text-xs text-nfc-muted">Waterproof sticker for helmet/bike</p>
                  </div>
                </div>
                <p className="font-bold text-nfc-dark">₹{price}</p>
              </div>
              <div className="flex items-center justify-between py-4">
                <span className="text-sm font-medium text-nfc-muted">Quantity</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg border border-nfc-border text-nfc-dark font-bold text-lg hover:bg-nfc-outer transition-colors">−</button>
                  <span className="w-8 text-center font-bold text-nfc-dark">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(99, q + 1))} className="w-9 h-9 rounded-lg border border-nfc-border text-nfc-dark font-bold text-lg hover:bg-nfc-outer transition-colors">+</button>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-nfc-border">
                <span className="font-bold text-nfc-dark">Total</span>
                <span className="text-xl font-extrabold text-nfc-red">₹{total}</span>
              </div>
            </div>
          )}

          {/* STEP 1: SHIPPING */}
          {step === 1 && (
            <div>
              <h2 className="font-bold text-nfc-dark mb-4">Shipping Address</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Full Name *" value={shipping.fullName} onChange={(v) => upd("fullName", v)} full />
                <Field label="Address Line 1 *" value={shipping.address1} onChange={(v) => upd("address1", v)} full />
                <Field label="Address Line 2" value={shipping.address2} onChange={(v) => upd("address2", v)} full />
                <Field label="City *" value={shipping.city} onChange={(v) => upd("city", v)} />
                <Field label="State *" value={shipping.state} onChange={(v) => upd("state", v)} />
                <Field label="ZIP / Postal Code *" value={shipping.zipCode} onChange={(v) => upd("zipCode", v)} />
                <div>
                  <label className="block text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>Country</label>
                  <select value={shipping.country} onChange={(e) => upd("country", e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-nfc-border text-sm text-nfc-dark bg-white focus:border-nfc-red focus:outline-none">
                    {COUNTRIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <Field label="Phone" value={shipping.phone} onChange={(v) => upd("phone", v)} full />
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW */}
          {step === 2 && (
            <div>
              <h2 className="font-bold text-nfc-dark mb-4">Review Order</h2>
              <div className="rounded-xl border border-nfc-border divide-y divide-nfc-border mb-4">
                <div className="flex justify-between px-4 py-3 text-sm"><span className="text-nfc-muted">NFC Emergency Tag × {quantity}</span><span className="font-bold text-nfc-dark">₹{total}</span></div>
                <div className="flex justify-between px-4 py-3 text-sm"><span className="text-nfc-muted">Unit price</span><span className="text-nfc-dark">₹{price}</span></div>
                <div className="flex justify-between px-4 py-3"><span className="font-bold text-nfc-dark">Total payable</span><span className="text-lg font-extrabold text-nfc-red">₹{total}</span></div>
              </div>
              <p className="text-xs font-bold text-nfc-muted uppercase tracking-wide mb-2" style={{ fontFamily: "Space Mono, monospace" }}>Ship to</p>
              <div className="rounded-xl bg-nfc-outer border border-nfc-border px-4 py-3 text-sm text-nfc-dark leading-relaxed">
                <p className="font-bold">{shipping.fullName}</p>
                <p>{shipping.address1}{shipping.address2 ? `, ${shipping.address2}` : ""}</p>
                <p>{shipping.city}, {shipping.state} {shipping.zipCode}</p>
                <p>{shipping.country}{shipping.phone ? ` · ${shipping.phone}` : ""}</p>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT */}
          {step === 3 && (
            <div>
              <h2 className="font-bold text-nfc-dark mb-1">Payment</h2>
              <p className="text-sm text-nfc-muted mb-4">Scan the QR with any UPI app and pay <span className="font-bold text-nfc-dark">₹{total}</span>, then enter your transaction ID below.</p>
              <div className="flex flex-col items-center mb-5">
                {qrSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrSrc} alt="UPI QR code" width={220} height={220} className="rounded-xl border border-nfc-border" />
                ) : (
                  <div className="w-[220px] h-[220px] rounded-xl border-2 border-dashed border-nfc-border flex flex-col items-center justify-center text-center p-4">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#8a857c" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                    <p className="text-xs text-nfc-subtle mt-3">Payment QR will appear here once the store UPI ID is configured by admin.</p>
                  </div>
                )}
                {upiId && <p className="text-xs text-nfc-muted mt-2">UPI ID: <span className="font-mono font-bold text-nfc-dark">{upiId}</span></p>}
              </div>
              <label className="block text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>UPI Transaction ID *</label>
              <input value={txnId} onChange={(e) => setTxnId(e.target.value)} placeholder="e.g. 428391756293" className="w-full px-3 py-2.5 rounded-xl border border-nfc-border text-sm text-nfc-dark focus:border-nfc-red focus:outline-none" />
              <p className="text-xs text-nfc-subtle mt-2">Enter the reference / UTR number shown in your UPI app after payment.</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-5">
          {step > 0 ? (
            <button onClick={back} className="px-5 py-2.5 rounded-xl border border-nfc-border text-nfc-dark text-sm font-bold hover:bg-white transition-colors">Back</button>
          ) : (
            <Link href="/dashboard" className="px-5 py-2.5 rounded-xl border border-nfc-border text-nfc-dark text-sm font-bold hover:bg-white transition-colors">Cancel</Link>
          )}
          {step < STEPS.length - 1 ? (
            <button onClick={next} className="px-6 py-2.5 rounded-xl bg-nfc-red text-white text-sm font-bold hover:bg-red-700 transition-colors">
              {step === 0 ? "Add shipping →" : step === 1 ? "Review order →" : "Proceed to payment →"}
            </button>
          ) : (
            <button onClick={finish} disabled={submitting} className="px-6 py-2.5 rounded-xl bg-nfc-red text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-60">
              {submitting ? "Placing order…" : "Finish"}
            </button>
          )}
        </div>
      </main>
    </>
  );
}

function Field({ label, value, onChange, full }: { label: string; value: string; onChange: (v: string) => void; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="block text-xs font-bold text-nfc-muted uppercase tracking-wide mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-nfc-border text-sm text-nfc-dark focus:border-nfc-red focus:outline-none" />
    </div>
  );
}
