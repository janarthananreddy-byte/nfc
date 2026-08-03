import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-nfc-outer">
      {/* Nav */}
      <header className="bg-nfc-dark">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-nfc-red flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span className="font-extrabold text-white text-lg tracking-tight">
              NFC<span className="text-nfc-red">ID</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/70 hover:text-white transition-colors font-medium">Sign in</Link>
            <Link href="/signup" className="px-4 py-2 bg-nfc-red text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-nfc-red-light border border-nfc-red/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-nfc-red animate-scanpulse inline-block"></span>
            <span className="text-xs font-bold text-nfc-red" style={{ fontFamily: "Space Mono, monospace", letterSpacing: "0.1em" }}>
              EMERGENCY Call
            </span>
          </div>
          <h1 className="text-5xl font-extrabold text-nfc-dark tracking-tight leading-tight mb-6">
            Your emergency<br />info,{" "}
            <span className="text-nfc-red">one tap away</span>
          </h1>
          <p className="text-lg text-nfc-muted leading-relaxed mb-8">
            Create your NFC Emergency ID card. Attach the smart tag to your helmet or bike.
            In an emergency, first responders can scan it instantly to see your blood type,
            emergency contacts, and medical info — no app needed.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link href="/signup" className="px-6 py-3 bg-nfc-red text-white font-bold rounded-xl hover:bg-red-700 transition-colors text-sm">
              Create Your Card →
            </Link>
            <Link href="/login" className="px-6 py-3 bg-white text-nfc-dark font-bold rounded-xl border border-nfc-border hover:border-nfc-red/40 transition-colors text-sm">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: "🏥", title: "Instant Emergency Access", desc: "No app needed. Any smartphone can scan your NFC tag and see your emergency contacts and blood type." },
            { icon: "✏️", title: "Always Up to Date", desc: "Update your contacts, blood type, and medical info anytime from your dashboard. Changes are instant." },
            { icon: "📦", title: "Physical Tag Shipped", desc: "Enter your shipping address and we'll send you a waterproof NFC sticker ready to attach to your helmet." },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-nfc-border p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-nfc-dark mb-2">{f.title}</h3>
              <p className="text-sm text-nfc-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="bg-nfc-dark rounded-2xl p-5 text-center">
          <p className="text-white/60 text-sm">
            Admin?{" "}
            <Link href="/admin" className="text-nfc-red font-semibold hover:underline">
              Go to Admin Panel →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
