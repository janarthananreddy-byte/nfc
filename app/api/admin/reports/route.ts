import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "7";
  const days = parseInt(range);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // Daily tap counts for chart
  const daily: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(d.getDate() + 1);
    const count = await prisma.nfcTap.count({ where: { tappedAt: { gte: d, lt: nextD } } });
    daily.push({ date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }), count });
  }

  // Recent taps with user info
  const skip = (page - 1) * limit;
  const [taps, total] = await Promise.all([
    prisma.nfcTap.findMany({
      where: { tappedAt: { gte: startDate } },
      orderBy: { tappedAt: "desc" },
      skip,
      take: limit,
      include: {
        tag: {
          select: {
            tagSlug: true,
            user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    }),
    prisma.nfcTap.count({ where: { tappedAt: { gte: startDate } } }),
  ]);

  // Top tags by taps
  const topTags = await prisma.nfcTag.findMany({
    take: 5,
    orderBy: { taps: { _count: "desc" } },
    select: {
      tagSlug: true,
      _count: { select: { taps: true } },
      user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
    },
  });

  return NextResponse.json({ daily, taps, total, topTags, pages: Math.ceil(total / limit) });
}
