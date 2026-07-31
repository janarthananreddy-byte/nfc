import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, relationship, phone, isPrimary } = body;

  const contact = await prisma.emergencyContact.findUnique({ where: { id } });
  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { profileId: contact.profileId },
      data: { isPrimary: false },
    });
  }

  const updated = await prisma.emergencyContact.update({
    where: { id },
    data: { name, relationship, phone, isPrimary: !!isPrimary },
  });
  await logAudit({
    actorEmail: session.user.email || "",
    action: "contact_updated",
    targetType: "user",
    targetId: session.user.id,
    targetLabel: session.user.email || session.user.id,
    details: `Updated emergency contact ${name} (${relationship}) ${phone}`,
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await prisma.emergencyContact.findUnique({ where: { id } });
  await prisma.emergencyContact.delete({ where: { id } });
  await logAudit({
    actorEmail: session.user.email || "",
    action: "contact_deleted",
    targetType: "user",
    targetId: session.user.id,
    targetLabel: session.user.email || session.user.id,
    details: existing ? `Deleted emergency contact ${existing.name}` : "Deleted emergency contact",
  });
  return NextResponse.json({ success: true });
}
