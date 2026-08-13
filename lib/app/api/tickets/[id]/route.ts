import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const ticket = await prisma.ticket.findFirst({
    where: { OR: [{ id }, { ticketNo: id }] },
    include: {
      category: { select: { name: true } },
      subCategory: { select: { name: true } },
      assignedAgent: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
      assignedTeam: { select: { name: true } },
      requester: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
      attachments: { where: { commentId: null }, select: { id: true, filename: true, mimeType: true, sizeBytes: true, createdAt: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, email: true, role: true, profile: { select: { firstName: true, lastName: true } } } },
          attachments: { select: { id: true, filename: true, mimeType: true, sizeBytes: true } },
        },
      },
    },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const staff = isStaff(session.user.role);
  if (!staff && ticket.requesterId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // hide internal notes from the requester
  if (!staff) ticket.comments = ticket.comments.filter((c) => c.visibility !== "INTERNAL");

  return NextResponse.json({ ticket, staff });
}
