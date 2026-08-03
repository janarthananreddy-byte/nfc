"use client";
import { useEffect } from "react";

let __coords = { lat: "", lng: "" };
let __requested = false;
function ensureCoords() {
  if (__requested || typeof navigator === "undefined" || !navigator.geolocation) return;
  __requested = true;
  navigator.geolocation.getCurrentPosition(
    (p) => { __coords = { lat: String(p.coords.latitude), lng: String(p.coords.longitude) }; },
    () => {},
    { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
  );
}

interface Contact { name: string; relationship: string; phone: string; }

function Phone({ color, size = 24 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

export function CallLink({ tagSlug, contact, primary }: { tagSlug: string; contact: Contact; primary?: boolean }) {
  useEffect(() => { ensureCoords(); }, []);

  function record() {
    try {
      const blob = new Blob([JSON.stringify({ contactName: contact.name, relationship: contact.relationship, phone: contact.phone, latitude: __coords.lat, longitude: __coords.lng })], { type: "application/json" });
      navigator.sendBeacon(`/api/tap/${tagSlug}/call`, blob);
    } catch {
      // ignore
    }
  }

  if (primary) {
    return (
      <a href={`tel:${contact.phone}`} onClick={record} className="animate-ring" style={{ display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", background: "#e11900", borderRadius: "18px", padding: "16px 18px", marginBottom: "10px" }}>
        <span style={{ width: "46px", height: "46px", borderRadius: "50%", flex: "none", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Phone color="#fff" />
        </span>
        <span style={{ flex: 1 }}>
          <span style={{ display: "block", font: "700 17px 'Archivo',sans-serif", color: "#fff" }}>{contact.name}</span>
          <span style={{ display: "block", font: "500 12px 'Space Mono',monospace", color: "rgba(255,255,255,.82)", marginTop: "2px" }}>{contact.relationship.toUpperCase()} - PRIMARY</span>
        </span>
        <span style={{ font: "700 13px 'Space Mono',monospace", color: "#fff", letterSpacing: ".06em" }}>CALL</span>
      </a>
    );
  }

  return (
    <a href={`tel:${contact.phone}`} onClick={record} style={{ display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", background: "#fff", border: "1.5px solid #e7e4df", borderRadius: "18px", padding: "14px 18px", marginBottom: "10px" }}>
      <span style={{ width: "46px", height: "46px", borderRadius: "50%", flex: "none", background: "#fdece9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Phone color="#e11900" size={20} />
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", font: "700 17px 'Archivo',sans-serif", color: "#16140f" }}>{contact.name}</span>
        <span style={{ display: "block", font: "500 12px 'Space Mono',monospace", color: "#8a857c", marginTop: "2px" }}>{contact.relationship.toUpperCase()}</span>
      </span>
      <span style={{ font: "700 13px 'Space Mono',monospace", color: "#e11900", letterSpacing: ".06em" }}>CALL</span>
    </a>
  );
}
