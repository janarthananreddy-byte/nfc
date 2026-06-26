"use client";
import { useEffect } from "react";

export function TapRecorder({ tagSlug }: { tagSlug: string }) {
  useEffect(() => {
    fetch(`/api/tap/${tagSlug}`, { method: "POST" }).catch(() => {});
  }, [tagSlug]);
  return null;
}
