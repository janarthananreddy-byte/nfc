"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";

const IdleContext = createContext<number | null>(null);

export function useIdleRemaining() {
  return useContext(IdleContext);
}

export function IdleProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [remaining, setRemaining] = useState<number | null>(null);
  const lastActivity = useRef<number>(Date.now());
  const timeoutMs = useRef<number>(30 * 60 * 1000);

  useEffect(() => {
    if (status !== "authenticated") {
      setRemaining(null);
      return;
    }
    let cancelled = false;

    function activity() {
      lastActivity.current = Date.now();
    }
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, activity, { passive: true }));

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d && d.sessionTimeout) timeoutMs.current = (Number(d.sessionTimeout) || 30) * 60 * 1000;
      })
      .catch(() => {});

    const iv = setInterval(() => {
      const rem = timeoutMs.current - (Date.now() - lastActivity.current);
      if (rem <= 0) {
        setRemaining(0);
        signOut({ callbackUrl: "/login" });
      } else {
        setRemaining(Math.ceil(rem / 1000));
      }
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(iv);
      events.forEach((e) => window.removeEventListener(e, activity));
    };
  }, [status]);

  return <IdleContext.Provider value={remaining}>{children}</IdleContext.Provider>;
}
