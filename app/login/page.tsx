"use client";
import { useState, useRef, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Step = "email" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep]       = useState<Step>("email");
  const [email, setEmail]     = useState("");
  const [otp, setOtp]         = useState(["", "", "", "", "", ""]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCd, setResendCd] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCd <= 0) return;
    const t = setTimeout(() => setResendCd((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCd]);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, context: "login" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep("otp");
      setResendCd(60);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendCd > 0) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, context: "login" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResendCd(60);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpKey(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) {
      setOtp(text.split(""));
      otpRefs.current[5]?.focus();
      e.preventDefault();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Enter the 6-digit code"); return; }
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, otp: code, redirect: false });
    setLoading(false);
    if (res?.ok) {
      router.push("/dashboard");
    } else {
      setError("Invalid or expired code. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-nfc-outer flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-nfc-red mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">
            {step === "email" ? "Welcome back" : "Check your email"}
          </h1>
          <p className="text-nfc-muted text-sm mt-1">
            {step === "email"
              ? "Sign in to your Emergency Call account"
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-nfc-border shadow-sm p-6">
          {step === "email" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
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
                {loading ? "Sending code…" : "Send Login Code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              {error && (
                <div className="bg-nfc-red-light border border-nfc-red/20 text-nfc-red rounded-xl px-4 py-3 text-sm font-medium">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-nfc-muted uppercase tracking-widest mb-3 text-center" style={{ fontFamily: "Space Mono, monospace" }}>
                  Enter 6-digit code
                </label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKey(i, e)}
                      className="w-11 h-14 text-center text-xl font-bold rounded-xl border-2 border-nfc-border bg-nfc-bg text-nfc-dark focus:outline-none focus:border-nfc-red focus:ring-2 focus:ring-nfc-red/10 transition-colors"
                    />
                  ))}
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || otp.join("").length < 6}
                className="w-full bg-nfc-red text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 text-sm tracking-wide"
              >
                {loading ? "Verifying…" : "Sign In"}
              </button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep("email"); setError(""); setOtp(["","","","","",""]); }}
                  className="text-nfc-muted hover:text-nfc-dark transition-colors"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCd > 0}
                  className="text-nfc-red font-semibold hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {resendCd > 0 ? `Resend in ${resendCd}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center mt-4 text-sm text-nfc-muted">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-nfc-red font-semibold hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
