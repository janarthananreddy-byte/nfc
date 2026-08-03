"use client";
import { SessionProvider } from "next-auth/react";
import { IdleProvider } from "@/components/IdleProvider";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <IdleProvider>{children}</IdleProvider>
    </SessionProvider>
  );
}
