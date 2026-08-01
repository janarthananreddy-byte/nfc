"use client";
import { SessionProvider } from "next-auth/react";
import { IdleTimeout } from "@/components/IdleTimeout";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <IdleTimeout />
      {children}
    </SessionProvider>
  );
}
