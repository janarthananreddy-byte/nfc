import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const t = await prisma.ticket.findUnique({ where: { id } });
  if (!t) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const data: Record<string, unknown> = { updatedAt: new Date() };
  const events: { field: string; from: string; to: string }[] = [];

  if (body.status && body.status !== t.status) {
    data.status = body.status; events.push({ field: "status", from: t.status, to: body.status });
    if (body.status === "RESOLVED") data.resolvedAt = new Date();
    if (body.status === "CLOSED") data.closedAt = new Date();
  }
  if (body.priority && body.priority !== t.priority) { data.priority = body.priority; events.push({ field: "priority", from: t.priority, to: body.priority }); }
  if (body.categoryId !== undefined && body.categoryId !== t.categoryId) { data.categoryId = body.categoryId || null; events.push({ field: "category", from: t.categoryId || "—", to: body.categoryId || "—" }); }
  if (body.subCategoryId !== undefined) data.subCategoryId = body.subCategoryId || null;
  if (body.assignedAgentId !== undefined && body.assignedAgentId !== t.assignedAgentId) { data.assignedAgentId = body.assignedAgentId || null; events.push({ field: "agent", from: t.assignedAgentId || "unassigned", to: body.assignedAgentId || "unassigned" }); }
  if (body.assignedTeamId !== undefined) data.assignedTeamId = body.assignedTeamId || null;
  if (body.escalated !== undefined && !!body.escalated !== t.escalated) { data.escalated = !!body.escalated; events.push({ field: "escalated", from: String(t.escalated), to: String(!!body.escalated) }); }

  await prisma.ticket.update({ where: { id }, data });

  for (const e of events) {
    await prisma.ticketComment.create({ data: { ticketId: id, authorId: session.user.id, kind: "SYSTEM", visibility: "PUBLIC", body: `${e.field} changed from ${e.from} to ${e.to}.` } });
    await logAudit({ actorEmail: session.user.email || "", action: "ticket_" + e.field + "_changed", targetType: "ticket", targetId: id, targetLabel: t.ticketNo, details: `${e.field}: "${e.from}" → "${e.to}"` });
  }
  if (events.find((e) => e.field === "status")) await notify({ userId: t.requesterId, event: body.status === "RESOLVED" ? "ticket_resolved" : "ticket_status", ticketId: id, vars: { ticketNo: t.ticketNo, status: body.status } });
  if (data.assignedAgentId) await notify({ userId: data.assignedAgentId as string, event: "ticket_assigned", ticketId: id, vars: { ticketNo: t.ticketNo, agent: "you" } });

  return NextResponse.json({ ok: true });
}
