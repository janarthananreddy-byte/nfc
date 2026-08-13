import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const targetNo = (body.targetTicketNo || "").trim();
  const target = await prisma.ticket.findFirst({ where: { ticketNo: targetNo } });
  const source = await prisma.ticket.findUnique({ where: { id } });
  if (!source || !target) return NextResponse.json({ error: "Target ticket not found." }, { status: 404 });
  if (target.id === source.id) return NextResponse.json({ error: "Cannot merge a ticket into itself." }, { status: 400 });

  await prisma.ticket.update({ where: { id }, data: { status: "CLOSED", closedAt: new Date(), mergedIntoId: target.id } });
  await prisma.ticketComment.create({ data: { ticketId: id, authorId: session.user.id, kind: "SYSTEM", visibility: "PUBLIC", body: `Merged into ${target.ticketNo} and closed.` } });
  await prisma.ticketComment.create({ data: { ticketId: target.id, authorId: session.user.id, kind: "SYSTEM", visibility: "INTERNAL", body: `${source.ticketNo} was merged into this ticket.` } });
  await logAudit({ actorEmail: session.user.email || "", action: "ticket_merged", targetType: "ticket", targetId: id, targetLabel: source.ticketNo, details: `Merged into ${target.ticketNo}` });
  return NextResponse.json({ ok: true });
}
