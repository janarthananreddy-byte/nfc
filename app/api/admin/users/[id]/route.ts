import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: { include: { contacts: { orderBy: { sortOrder: "asc" } } } },
      nfcTag: { include: { _count: { select: { taps: true } } } },
      shippingAddresses: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();

  if (body.action === "setTagSlug") {
    const raw = String(body.tagSlug || "").trim().toLowerCase();
    const slug = raw.replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    if (!slug) return NextResponse.json({ error: "Tag URL cannot be empty" }, { status: 400 });

    const tag = await prisma.nfcTag.findUnique({ where: { userId: id } });
    if (!tag) return NextResponse.json({ error: "This user has no NFC tag" }, { status: 404 });

    if (slug !== tag.tagSlug) {
      const clash = await prisma.nfcTag.findUnique({ where: { tagSlug: slug } });
      if (clash) return NextResponse.json({ error: "That tag URL is already taken" }, { status: 409 });
    }

    const oldSlug = tag.tagSlug;
    const updated = await prisma.nfcTag.update({ where: { userId: id }, data: { tagSlug: slug } });

    const user = await prisma.user.findUnique({ where: { id }, select: { email: true } });
    await logAudit({
      actorEmail: session.user.email || "",
      action: "tag_url_changed",
      targetType: "user",
      targetId: id,
      targetLabel: user?.email || id,
      details: `Tag URL: "${oldSlug}" → "${slug}"`,
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
