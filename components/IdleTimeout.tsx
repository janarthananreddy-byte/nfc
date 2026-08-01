"use client";
import { useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";

export function IdleTimeout() {
  const { status } = useSession();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minutes = useRef<number>(30);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;

    function reset() {
      if (timer.current) clearTimeout(timer.current);
      const ms = Math.max(1, minutes.current) * 60 * 1000;
      timer.current = setTimeout(() => {
        signOut({ callbackUrl: "/login" });
      }, ms);
    }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));

    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d && d.sessionTimeout) minutes.current = Number(d.sessionTimeout) || 30;
        reset();
      })
      .catch(() => reset());

    reset();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [status]);

  return null;
}
