import { SupportNav } from "@/components/support/SupportNav";

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SupportNav />
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
