import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: Promise<{ tagId: string }> }) {
  const { tagId } = await params;

  const tag = await prisma.nfcTag.findUnique({ where: { tagSlug: tagId } });
  if (!tag || !tag.isActive) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "";
  const userAgent = req.headers.get("user-agent") || "";

  await prisma.nfcTap.create({
    data: { tagId: tag.id, ipAddress: ip, userAgent },
  });

  return NextResponse.json({ recorded: true });
}
