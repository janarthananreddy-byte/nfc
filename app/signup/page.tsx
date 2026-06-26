"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Signup failed");
      setLoading(false);
      return;
    }

    const loginRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);
    if (loginRes?.ok) {
      router.push("/profile");
    } else {
      router.push("/login");
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
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Create your account</h1>
          <p className="text-nfc-muted text-sm mt-1">Get your NFC Emergency ID card</p>
        </div>

        <div className="bg-white rounded-2xl border border-nfc-border shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-nfc-red-light border border-nfc-red/20 text-nfc-red rounded-xl px-4 py-3 text-sm font-medium">
                {error}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>First Name</label>
                <input
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  placeholder="Marco"
                  className="w-full px-3 py-2.5 rounded-xl border border-nfc-border bg-nfc-bg text-nfc-dark text-sm focus:outline-none focus:border-nfc-red focus:ring-2 focus:ring-nfc-red/10 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>Last Name</label>
                <input
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  placeholder="Reyes"
                  className="w-full px-3 py-2.5 rounded-xl border border-nfc-border bg-nfc-bg text-nfc-dark text-sm focus:outline-none focus:border-nfc-red focus:ring-2 focus:ring-nfc-red/10 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl border border-nfc-border bg-nfc-bg text-nfc-dark text-sm focus:outline-none focus:border-nfc-red focus:ring-2 focus:ring-nfc-red/10 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1.5" style={{ fontFamily: "Space Mono, monospace" }}>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                required
                minLength={8}
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 rounded-xl border border-nfc-border bg-nfc-bg text-nfc-dark text-sm focus:outline-none focus:border-nfc-red focus:ring-2 focus:ring-nfc-red/10 transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-nfc-red text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 text-sm tracking-wide"
            >
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center mt-4 text-sm text-nfc-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-nfc-red font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
