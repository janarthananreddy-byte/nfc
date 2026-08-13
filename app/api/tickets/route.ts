import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { nextTicketNumber } from "@/lib/ticketNumber";
import { notify } from "@/lib/notify";
import { slaDueDate } from "@/lib/sla";
import { validateAttachment, sanitizeFilename } from "@/lib/attachments";

export const dynamic = "force-dynamic";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const categoryId = searchParams.get("category") || "";
  const q = (searchParams.get("q") || "").trim();
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 10;

  const where: Record<string, unknown> = { requesterId: session.user.id };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (categoryId) where.categoryId = categoryId;
  if (from || to) where.createdAt = { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to + "T23:59:59") } : {}) };
  if (q) where.OR = [{ ticketNo: { contains: q } }, { subject: { contains: q } }];

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { updatedAt: "desc" },
      include: {
        category: { select: { name: true } },
        assignedAgent: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);
  return NextResponse.json({ tickets, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const subject = (body.subject || "").trim();
  const description = (body.description || "").trim();
  const priority = PRIORITIES.includes(body.priority) ? body.priority : "MEDIUM";
  const categoryId = body.categoryId || null;
  const subCategoryId = body.subCategoryId || null;
  const contactInfo = (body.contactInfo || "").trim();
  const referenceNo = (body.referenceNo || "").trim();
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];

  if (!subject || !description) {
    return NextResponse.json({ error: "Subject and description are required." }, { status: 400 });
  }
  for (const a of attachments) {
    const err = validateAttachment({ filename: a.filename || "", sizeBytes: a.sizeBytes || 0 });
    if (err) return NextResponse.json({ error: err }, { status: 400 });
  }

  const ticketNo = await nextTicketNumber();
  const slaDueAt = slaDueDate(priority);

  const ticket = await prisma.ticket.create({
    data: {
      ticketNo, subject, description, priority, status: "NEW",
      requesterId: session.user.id, categoryId, subCategoryId, contactInfo, referenceNo, slaDueAt,
    },
  });

  if (attachments.length) {
    await prisma.ticketAttachment.createMany({
      data: attachments.map((a: { filename: string; mimeType: string; data: string; sizeBytes: number }) => ({
        ticketId: ticket.id, uploaderId: session.user.id,
        filename: sanitizeFilename(a.filename), mimeType: a.mimeType || "application/octet-stream",
        sizeBytes: a.sizeBytes || 0, data: a.data || "",
      })),
    });
  }

  await prisma.ticketComment.create({
    data: { ticketId: ticket.id, authorId: session.user.id, kind: "SYSTEM", visibility: "PUBLIC", body: `Ticket created with priority ${priority}.` },
  });

  await notify({ userId: session.user.id, event: "ticket_created", ticketId: ticket.id, vars: { ticketNo, subject } });
  await logAudit({ actorEmail: session.user.email || "", action: "ticket_created", targetType: "ticket", targetId: ticket.id, targetLabel: ticketNo, details: `Created "${subject}" (${priority})` });

  return NextResponse.json({ ticket }, { status: 201 });
}
