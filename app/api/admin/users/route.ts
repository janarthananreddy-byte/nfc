import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { firstName: true, lastName: true, bloodType: true } },
        nfcTag: {
          select: { tagSlug: true, isActive: true, _count: { select: { taps: true } } },
        },
        shippingAddresses: { where: { isDefault: true }, select: { city: true, country: true } },
      },
    }),
    prisma.user.count(),
  ]);

  return NextResponse.json({ users, total, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, action } = await req.json();

  if (action === "toggleTag") {
    const tag = await prisma.nfcTag.findUnique({ where: { userId } });
    if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    const updated = await prisma.nfcTag.update({
      where: { userId },
      data: { isActive: !tag.isActive },
    });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    await logAudit({
      actorEmail: session.user.email || "",
      action: updated.isActive ? "tag_enabled" : "tag_disabled",
      targetType: "user",
      targetId: userId,
      targetLabel: u?.email || userId,
      details: `Tag ${updated.isActive ? "enabled" : "disabled"}`,
    });
    return NextResponse.json(updated);
  }

  if (action === "deleteUser") {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    await prisma.user.delete({ where: { id: userId } });
    await logAudit({
      actorEmail: session.user.email || "",
      action: "user_deleted",
      targetType: "user",
      targetId: userId,
      targetLabel: u?.email || userId,
      details: `Deleted account ${u?.email || userId}`,
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
