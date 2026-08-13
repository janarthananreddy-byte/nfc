import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { isStaff } from "@/lib/authz";
import { validateAttachment, sanitizeFilename } from "@/lib/attachments";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const staff = isStaff(session.user.role);

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!staff && ticket.requesterId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const text = (body.body || "").trim();
  const internal = staff && !!body.internal;
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];
  if (!text && !attachments.length) return NextResponse.json({ error: "Message is required." }, { status: 400 });
  for (const a of attachments) {
    const err = validateAttachment({ filename: a.filename || "", sizeBytes: a.sizeBytes || 0 });
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }

  const comment = await prisma.ticketComment.create({
    data: { ticketId: ticket.id, authorId: session.user.id, body: text, visibility: internal ? "INTERNAL" : "PUBLIC", kind: "REPLY" },
  });
  if (attachments.length) {
    await prisma.ticketAttachment.createMany({
      data: attachments.map((a: { filename: string; mimeType: string; data: string; sizeBytes: number }) => ({
        ticketId: ticket.id, commentId: comment.id, uploaderId: session.user.id,
        filename: sanitizeFilename(a.filename), mimeType: a.mimeType || "application/octet-stream", sizeBytes: a.sizeBytes || 0, data: a.data || "",
      })),
    });
  }

  const upd: Record<string, unknown> = { updatedAt: new Date() };
  if (staff && !internal && !ticket.firstResponseAt) upd.firstResponseAt = new Date();
  if (staff && !internal && ticket.status === "NEW") upd.status = "OPEN";
  await prisma.ticket.update({ where: { id: ticket.id }, data: upd });

  if (!internal) {
    if (staff && ticket.requesterId) {
      await notify({ userId: ticket.requesterId, event: "agent_reply", ticketId: ticket.id, vars: { ticketNo: ticket.ticketNo, agent: session.user.email || "Support" } });
    } else if (!staff && ticket.assignedAgentId) {
      await notify({ userId: ticket.assignedAgentId, event: "customer_reply", ticketId: ticket.id, vars: { ticketNo: ticket.ticketNo, customer: session.user.email || "Customer" } });
    }
  }
  await logAudit({ actorEmail: session.user.email || "", action: internal ? "ticket_internal_note" : "ticket_reply", targetType: "ticket", targetId: ticket.id, targetLabel: ticket.ticketNo, details: internal ? "Added internal note" : "Added reply" });

  return NextResponse.json({ comment }, { status: 201 });
}
