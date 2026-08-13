import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const tickets = await prisma.ticket.findMany({
    select: { status: true, priority: true, categoryId: true, assignedAgentId: true, createdAt: true, resolvedAt: true, slaDueAt: true, csatRating: true, reopenCount: true, escalated: true },
  });
  const cats = await prisma.category.findMany({ select: { id: true, name: true } });
  const agents = await prisma.user.findMany({ where: { role: { in: ["agent", "admin"] } }, select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } });
  const catName = Object.fromEntries(cats.map((c) => [c.id, c.name]));

  const by = (key: "status" | "priority") => {
    const m: Record<string, number> = {};
    for (const t of tickets) m[t[key]] = (m[t[key]] || 0) + 1;
    return m;
  };
  const byStatus = by("status");
  const byPriority = by("priority");

  const byCategory: Record<string, number> = {};
  for (const t of tickets) { const n = t.categoryId ? (catName[t.categoryId] || "Other") : "Uncategorized"; byCategory[n] = (byCategory[n] || 0) + 1; }

  // created over last 14 days
  const days: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push({ date: d.toISOString().slice(0, 10), count: 0 }); }
  const dayIdx = Object.fromEntries(days.map((d, i) => [d.date, i]));
  for (const t of tickets) { const k = new Date(t.createdAt).toISOString().slice(0, 10); if (k in dayIdx) days[dayIdx[k]].count++; }

  // avg resolution time (hours)
  const resolved = tickets.filter((t) => t.resolvedAt);
  const avgResolutionHrs = resolved.length ? Math.round(resolved.reduce((s, t) => s + (new Date(t.resolvedAt!).getTime() - new Date(t.createdAt).getTime()), 0) / resolved.length / 3600000 * 10) / 10 : 0;

  // agent workload (open, non-closed)
  const openStatuses = new Set(["NEW", "OPEN", "IN_PROGRESS", "PENDING_CUSTOMER"]);
  const workload = agents.map((a) => ({
    name: `${a.profile?.firstName || ""} ${a.profile?.lastName || ""}`.trim() || a.email,
    count: tickets.filter((t) => t.assignedAgentId === a.id && openStatuses.has(t.status)).length,
  }));

  const now = Date.now();
  const overdue = tickets.filter((t) => t.slaDueAt && openStatuses.has(t.status) && new Date(t.slaDueAt).getTime() < now).length;
  const rated = tickets.filter((t) => t.csatRating != null);
  const csatAvg = rated.length ? Math.round(rated.reduce((s, t) => s + (t.csatRating || 0), 0) / rated.length * 10) / 10 : 0;

  const kpis = {
    total: tickets.length,
    new: byStatus.NEW || 0,
    open: byStatus.OPEN || 0,
    inProgress: byStatus.IN_PROGRESS || 0,
    pending: byStatus.PENDING_CUSTOMER || 0,
    resolved: byStatus.RESOLVED || 0,
    closed: byStatus.CLOSED || 0,
    critical: tickets.filter((t) => t.priority === "CRITICAL" && openStatuses.has(t.status)).length,
    overdue,
    reopened: tickets.filter((t) => t.reopenCount > 0).length,
    escalated: tickets.filter((t) => t.escalated).length,
    csatAvg, csatCount: rated.length, avgResolutionHrs,
  };
  return NextResponse.json({
    kpis, byStatus, byPriority,
    byCategory: Object.entries(byCategory).map(([name, count]) => ({ name, count })),
    createdOverTime: days,
    workload,
  });
}
