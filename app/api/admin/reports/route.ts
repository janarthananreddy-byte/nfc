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
  const allTime = range === "all";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 50;

  let startDate: Date;
  if (allTime) {
    const first = await prisma.nfcTap.findFirst({ orderBy: { tappedAt: "asc" }, select: { tappedAt: true } });
    startDate = first ? new Date(first.tappedAt) : new Date();
  } else {
    const days = parseInt(range) || 7;
    startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
  }
  startDate.setHours(0, 0, 0, 0);

  const now = new Date();
  const spanDays = Math.floor((now.getTime() - startDate.getTime()) / 86400000) + 1;
  const monthly = allTime && spanDays > 120;

  // Bucket taps for the chart in a single query
  const chartTaps = await prisma.nfcTap.findMany({ where: { tappedAt: { gte: startDate } }, select: { tappedAt: true } });
  const daily: { date: string; count: number }[] = [];
  const idx: Record<string, number> = {};
  if (monthly) {
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 1);
    while (d <= end) {
      idx[`${d.getFullYear()}-${d.getMonth()}`] = daily.length;
      daily.push({ date: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }), count: 0 });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }
    for (const t of chartTaps) {
      const dt = new Date(t.tappedAt);
      const k = `${dt.getFullYear()}-${dt.getMonth()}`;
      if (idx[k] !== undefined) daily[idx[k]].count++;
    }
  } else {
    for (let i = 0; i < spanDays; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      idx[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] = daily.length;
      daily.push({ date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }), count: 0 });
    }
    for (const t of chartTaps) {
      const d = new Date(t.tappedAt);
      const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (idx[k] !== undefined) daily[idx[k]].count++;
    }
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
