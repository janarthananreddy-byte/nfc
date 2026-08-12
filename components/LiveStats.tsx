"use client";
import { useEffect, useState } from "react";

interface Stats { signups: number; taps: number; contacted: number; }

export function LiveStats() {
  const [s, setS] = useState<Stats | null>(null);

  useEffect(() => {
    const load = () => fetch("/api/stats/public").then((r) => r.json()).then(setS).catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const items = [
    { label: "Signed Up", value: s?.signups },
    { label: "Total Taps", value: s?.taps },
    { label: "Contacted", value: s?.contacted },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((it) => (
        <div key={it.label} className="bg-white rounded-2xl border border-nfc-border p-6 text-center">
          <p className="text-2xl font-extrabold text-nfc-dark">{it.value == null ? "—" : it.value.toLocaleString()}</p>
          <p className="text-[10px] sm:text-xs font-bold text-nfc-muted uppercase tracking-widest mt-1" style={{ fontFamily: "Space Mono, monospace" }}>{it.label}</p>
        </div>
      ))}
    </div>
  );
}
