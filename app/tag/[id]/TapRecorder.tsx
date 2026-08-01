"use client";
import { useEffect } from "react";

export function TapRecorder({ tagSlug }: { tagSlug: string }) {
  useEffect(() => {
    function send(body: Record<string, string>) {
      fetch(`/api/tap/${tagSlug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch(() => {});
    }
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => send({ latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }),
        () => send({}),
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
      );
    } else {
      send({});
    }
  }, [tagSlug]);
  return null;
}
