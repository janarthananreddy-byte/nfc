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
  const logoutAt = useRef<number>(0);

  useEffect(() => {
    if (status !== "authenticated") {
      setRemaining(null);
      logoutAt.current = 0;
      return;
    }
    let cancelled = false;
    let iv: ReturnType<typeof setInterval> | undefined;

    async function start() {
      let minutes = 30;
      try {
        const d = await (await fetch("/api/settings")).json();
        if (d && d.sessionTimeout) minutes = Number(d.sessionTimeout) || 30;
      } catch {
        // keep default
      }
      if (cancelled) return;

      if (!logoutAt.current) logoutAt.current = Date.now() + minutes * 60 * 1000;

      function tick() {
        const rem = Math.round((logoutAt.current - Date.now()) / 1000);
        if (rem <= 0) {
          setRemaining(0);
          if (iv) clearInterval(iv);
          signOut({ callbackUrl: "/login" });
        } else {
          setRemaining(rem);
        }
      }
      tick();
      iv = setInterval(tick, 1000);
    }
    start();

    return () => {
      cancelled = true;
      if (iv) clearInterval(iv);
    };
  }, [status]);

  return <IdleContext.Provider value={remaining}>{children}</IdleContext.Provider>;
}
