"use client";
import { useEffect, useRef, useState } from "react";

interface Stats { signups: number; taps: number; contacted: number; }

function useCountUp(target: number | undefined) {
  const [n, setN] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    if (target == null) return;
    const start = ref.current;
    const end = target;
    const dur = 900;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(start + (end - start) * eased);
      setN(val);
      ref.current = val;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return n;
}

function StatCard({ label, value }: { label: string; value: number | undefined }) {
  const n = useCountUp(value);
  return (
    <div className="bg-white rounded-2xl border border-nfc-border p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-nfc-red/40">
      <p className="text-3xl font-extrabold text-nfc-dark tabular-nums">{value == null ? "—" : n.toLocaleString()}</p>
      <p className="text-[10px] sm:text-xs font-bold text-nfc-muted uppercase tracking-widest mt-1" style={{ fontFamily: "Space Mono, monospace" }}>{label}</p>
    </div>
  );
}

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
      {items.map((it) => <StatCard key={it.label} label={it.label} value={it.value} />)}
    </div>
  );
}
