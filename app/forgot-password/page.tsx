"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResetUrl(data.resetUrl);
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-nfc-outer flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-nfc-red mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Reset Password</h1>
          <p className="text-nfc-muted text-sm mt-1">Enter your email to get a reset link</p>
        </div>

        <div className="bg-white rounded-2xl border border-nfc-border shadow-sm p-6">
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-nfc-red-light border border-nfc-red/20 text-nfc-red rounded-xl px-4 py-3 text-sm font-medium">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-nfc-border bg-nfc-bg text-nfc-dark text-sm focus:outline-none focus:border-nfc-red focus:ring-2 focus:ring-nfc-red/10 transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-nfc-red text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 text-sm tracking-wide"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <svg className="flex-shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <p className="text-green-800 text-sm font-medium">
                  {resetUrl
                    ? "A reset link has been generated."
                    : "If this email exists, a reset link would be emailed in production."}
                </p>
              </div>

              {resetUrl && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>
                    Your reset link
                  </p>
                  <div className="bg-nfc-bg border border-nfc-border rounded-xl px-4 py-3 break-all text-xs font-mono text-nfc-dark">
                    {typeof window !== "undefined" ? `${window.location.origin}${resetUrl}` : resetUrl}
                  </div>
                  <p className="text-xs text-nfc-muted">This link expires in 1 hour. In production it would be sent by email.</p>
                  <Link
                    href={resetUrl}
                    className="block w-full text-center bg-nfc-red text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm tracking-wide mt-2"
                  >
                    Open Reset Link
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center mt-4 text-sm text-nfc-muted">
          Remember your password?{" "}
          <Link href="/login" className="text-nfc-red font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
