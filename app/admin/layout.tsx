import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminNav } from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="flex min-h-screen bg-nfc-outer">
      <AdminNav />
      <main className="ml-56 flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
