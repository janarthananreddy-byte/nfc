import { UserNav } from "@/components/UserNav";

export default function ContactPage() {
  return (
    <>
      <UserNav />
      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Contact Us</h1>
          <p className="text-nfc-muted text-sm mt-1">Reach out to us for any help or support</p>
        </div>
        <div className="bg-white rounded-2xl border border-nfc-border p-6 space-y-5">
          <div>
            <p className="text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1" style={{ fontFamily: "Space Mono, monospace" }}>Name</p>
            <p className="text-nfc-dark font-semibold">Karthi</p>
          </div>
          <div>
            <p className="text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1" style={{ fontFamily: "Space Mono, monospace" }}>Location</p>
            <p className="text-nfc-dark font-semibold">Tamilnadu</p>
          </div>
          <div>
            <p className="text-xs font-bold text-nfc-muted uppercase tracking-widest mb-1" style={{ fontFamily: "Space Mono, monospace" }}>Email</p>
            <a href="mailto:skydio2@outlook.com" className="text-nfc-red font-semibold hover:underline">skydio2@outlook.com</a>
          </div>
        </div>
      </main>
    </>
  );
}
