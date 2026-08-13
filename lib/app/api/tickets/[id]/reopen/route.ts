import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!isStaff(session.user.role) && ticket.requesterId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!["RESOLVED", "CLOSED"].includes(ticket.status)) return NextResponse.json({ error: "Only resolved or closed tickets can be reopened." }, { status: 400 });

  await prisma.ticket.update({ where: { id }, data: { status: "OPEN", reopenCount: { increment: 1 }, resolvedAt: null, closedAt: null, updatedAt: new Date() } });
  await prisma.ticketComment.create({ data: { ticketId: id, authorId: session.user.id, kind: "SYSTEM", visibility: "PUBLIC", body: `Ticket reopened.` } });
  if (ticket.assignedAgentId) await notify({ userId: ticket.assignedAgentId, event: "ticket_reopened", ticketId: id, vars: { ticketNo: ticket.ticketNo } });
  await notify({ userId: ticket.requesterId, event: "ticket_reopened", ticketId: id, vars: { ticketNo: ticket.ticketNo } });
  await logAudit({ actorEmail: session.user.email || "", action: "ticket_reopened", targetType: "ticket", targetId: id, targetLabel: ticket.ticketNo, details: `Reopened from ${ticket.status}` });
  return NextResponse.json({ ok: true });
}
