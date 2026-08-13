import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/authz";
import { sanitizeFilename } from "@/lib/attachments";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;

  const att = await prisma.ticketAttachment.findUnique({
    where: { id },
    include: { ticket: { select: { requesterId: true } } },
  });
  if (!att) return new Response("Not found", { status: 404 });
  if (!isStaff(session.user.role) && att.ticket.requesterId !== session.user.id) {
    return new Response("Forbidden", { status: 403 });
  }

  const buf = Buffer.from(att.data, "base64");
  return new Response(buf, {
    headers: {
      "Content-Type": att.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${sanitizeFilename(att.filename)}"`,
      "Content-Length": String(buf.length),
      "Cache-Control": "private, no-store",
    },
  });
}
