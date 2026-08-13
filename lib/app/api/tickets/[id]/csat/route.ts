import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ticket.requesterId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!["RESOLVED", "CLOSED"].includes(ticket.status)) return NextResponse.json({ error: "You can rate a ticket after it is resolved." }, { status: 400 });

  const body = await req.json();
  const rating = Math.max(1, Math.min(5, parseInt(body.rating)));
  if (!rating) return NextResponse.json({ error: "Rating is required." }, { status: 400 });
  const comment = (body.comment || "").trim();

  await prisma.ticket.update({ where: { id }, data: { csatRating: rating, csatComment: comment } });
  await logAudit({ actorEmail: session.user.email || "", action: "ticket_csat", targetType: "ticket", targetId: id, targetLabel: ticket.ticketNo, details: `Rated ${rating}/5` });
  return NextResponse.json({ ok: true });
}
