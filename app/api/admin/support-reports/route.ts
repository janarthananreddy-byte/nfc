import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); const to = searchParams.get("to");
  const category = searchParams.get("category") || ""; const priority = searchParams.get("priority") || "";
  const agent = searchParams.get("agent") || ""; const status = searchParams.get("status") || "";

  const and: Record<string, unknown>[] = [];
  if (from || to) and.push({ createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to + "T23:59:59") } : {}) } });
  if (category) and.push({ categoryId: category });
  if (priority) and.push({ priority });
  if (agent) and.push({ assignedAgentId: agent });
  if (status) and.push({ status });
  const where = and.length ? { AND: and } : {};

  const tickets = await prisma.ticket.findMany({
    where, orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
      assignedAgent: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
      requester: { select: { email: true } },
    },
  });

  const closedSet = new Set(["RESOLVED", "CLOSED"]);
  const groupCount = (fn: (t: typeof tickets[number]) => string) => {
    const m: Record<string, number> = {}; for (const t of tickets) { const k = fn(t); m[k] = (m[k] || 0) + 1; } return m;
  };
  const resolved = tickets.filter((t) => t.resolvedAt);
  const responded = tickets.filter((t) => t.firstResponseAt);
  const rated = tickets.filter((t) => t.csatRating != null);
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : 0;
  const withSla = tickets.filter((t) => t.slaDueAt && t.resolvedAt);
  const slaMet = withSla.filter((t) => new Date(t.resolvedAt!) <= new Date(t.slaDueAt!)).length;

  const summary = {
    volume: tickets.length,
    open: tickets.filter((t) => !closedSet.has(t.status)).length,
    closed: tickets.filter((t) => closedSet.has(t.status)).length,
    byCategory: groupCount((t) => t.category?.name || "Uncategorized"),
    byPriority: groupCount((t) => t.priority),
    byStatus: groupCount((t) => t.status),
    byAgent: groupCount((t) => t.assignedAgent ? (`${t.assignedAgent.profile?.firstName || ""} ${t.assignedAgent.profile?.lastName || ""}`.trim() || t.assignedAgent.email) : "Unassigned"),
    avgFirstResponseHrs: avg(responded.map((t) => (new Date(t.firstResponseAt!).getTime() - new Date(t.createdAt).getTime()) / 3600000)),
    avgResolutionHrs: avg(resolved.map((t) => (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()) / 3600000)),
    slaCompliance: withSla.length ? Math.round(slaMet / withSla.length * 1000) / 10 : 100,
    csatAvg: rated.length ? avg(rated.map((t) => t.csatRating || 0)) : 0,
    csatCount: rated.length,
    reopened: tickets.filter((t) => t.reopenCount > 0).length,
    escalated: tickets.filter((t) => t.escalated).length,
  };

  const rows = tickets.map((t) => ({
    ticketNo: t.ticketNo, subject: t.subject, category: t.category?.name || "", priority: t.priority, status: t.status,
    customer: t.requester?.email || "", agent: t.assignedAgent ? (t.assignedAgent.email) : "",
    createdAt: t.createdAt, resolvedAt: t.resolvedAt, csatRating: t.csatRating ?? "", reopenCount: t.reopenCount, escalated: t.escalated ? "Yes" : "No",
  }));

  return NextResponse.json({ summary, rows });
}
