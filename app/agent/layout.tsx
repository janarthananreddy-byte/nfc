import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AgentNav } from "@/components/support/AgentNav";

export default async function AgentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session || !["agent", "admin"].includes(session.user.role)) redirect("/login");
  return (
    <>
      <AgentNav isAdmin={session.user.role === "admin"} />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </>
  );
}
