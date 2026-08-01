import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: Promise<{ tagId: string }> }) {
  const { tagId } = await params;

  const tag = await prisma.nfcTag.findUnique({
    where: { tagSlug: tagId },
    include: { user: { select: { email: true } } },
  });
  if (!tag) return NextResponse.json({ error: "Tag not found" }, { status: 404 });

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "";

  let contactName = "";
  let relationship = "";
  let phone = "";
  try {
    const body = await req.json();
    contactName = String(body.contactName || "").slice(0, 120);
    relationship = String(body.relationship || "").slice(0, 60);
    phone = String(body.phone || "").slice(0, 40);
  } catch {
    // no body
  }

  await prisma.tagCall.create({
    data: { tagId: tag.id, contactName, relationship, phone, ipAddress: ip },
  });

  await logAudit({
    actorEmail: "",
    action: "tag_call",
    targetType: "tag",
    targetId: tag.id,
    targetLabel: tag.user?.email || tag.tagSlug,
    details: `Stranger called ${contactName || phone}${relationship ? " (" + relationship + ")" : ""} ${phone}`.trim(),
  });

  return NextResponse.json({ ok: true });
}
