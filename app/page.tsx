import Link from "next/link";
import { LOGO_SRC } from "@/components/brand";
import { LiveStats } from "@/components/LiveStats";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-nfc-outer">
      <style>{`@keyframes floatLogo{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}@keyframes ringPulse{0%,100%{box-shadow:0 0 0 0 rgba(225,25,0,0.35)}50%{box-shadow:0 0 0 20px rgba(225,25,0,0)}}`}</style>
      {/* Nav */}
      <header style={{ backgroundColor: "#012963" }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={LOGO_SRC} alt="Emergency Call" className="w-9 h-9 object-contain" />
            <span className="font-extrabold text-white text-lg tracking-tight">
              Emergency<span className="text-nfc-red"> Call</span>
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
        <div className="flex flex-col md:flex-row items-center gap-8">
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
        <div className="flex-1 flex items-center justify-center w-full">
          <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center">
            <img src={LOGO_SRC} alt="Emergency Call" className="w-[90%] h-[90%] object-contain" style={{ animation: "floatLogo 3s ease-in-out infinite" }} />
          </div>
        </div>
        </div>
      </section>

      {/* Live stats */}
      <section className="max-w-6xl mx-auto px-4 pb-12 -mt-4">
        <LiveStats />
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: "🏥", title: "Instant Emergency Access", desc: "No app needed. Any smartphone can scan your NFC tag and see your emergency contacts and blood type." },
            { icon: "📞", title: "Your Privacy Protected", desc: "Your phone numbers stay masked when your tag is scanned. Responders can still reach your emergency contacts, but the actual numbers are never shown — your privacy always comes first." },
            { icon: "📦", title: "Get your physical NFC Tag", desc: "Enter your shipping address and we'll send you a waterproof NFC sticker ready to attach to your helmet." },
          ].map((f) => (
            <div key={f.title} className="bg-white rounded-2xl border border-nfc-border p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-nfc-dark mb-2">{f.title}</h3>
              <p className="text-sm text-nfc-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: "#012963" }} className="text-white mt-8">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src={LOGO_SRC} alt="Emergency Call" className="w-10 h-10 object-contain" />
                <span className="font-extrabold text-xl tracking-tight">Emergency<span className="text-nfc-red"> Call</span></span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed max-w-xs">Scan-to-help NFC emergency ID cards. Your critical info, one tap away — no app needed.</p>
            </div>
            <div>
              <h4 className="font-bold text-xs mb-4 uppercase tracking-widest text-white/70" style={{ fontFamily: "Space Mono, monospace" }}>Quick Links</h4>
              <ul className="space-y-2.5 text-sm text-white/70">
                <li><Link href="/signup" className="hover:text-white transition-colors">Create Your Card</Link></li>
                <li><Link href="/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                <li><Link href="/admin" className="hover:text-white transition-colors">Admin Panel</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-xs mb-4 uppercase tracking-widest text-white/70" style={{ fontFamily: "Space Mono, monospace" }}>Get in Touch</h4>
              <p className="text-sm text-white/70 mb-1">Karthi, Tamilnadu</p>
              <a href="mailto:skydio2@outlook.com" className="text-sm text-nfc-red hover:underline">skydio2@outlook.com</a>
            </div>
          </div>
          <div className="border-t border-white/15 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-white/50">© 2026 Emergency Call. All rights reserved.</p>
            <p className="text-xs text-white/50">Built for cyclist safety.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
