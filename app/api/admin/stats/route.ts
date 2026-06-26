import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfToday.getDate() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalUsers, totalTags, tapsToday, tapsWeek, tapsMonth, totalTaps] = await Promise.all([
    prisma.user.count(),
    prisma.nfcTag.count({ where: { isActive: true } }),
    prisma.nfcTap.count({ where: { tappedAt: { gte: startOfToday } } }),
    prisma.nfcTap.count({ where: { tappedAt: { gte: startOfWeek } } }),
    prisma.nfcTap.count({ where: { tappedAt: { gte: startOfMonth } } }),
    prisma.nfcTap.count(),
  ]);

  // Taps per day for last 7 days
  const dailyTaps: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(startOfToday);
    d.setDate(d.getDate() - i);
    const nextD = new Date(d);
    nextD.setDate(d.getDate() + 1);
    const count = await prisma.nfcTap.count({ where: { tappedAt: { gte: d, lt: nextD } } });
    dailyTaps.push({
      date: d.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      count,
    });
  }

  return NextResponse.json({ totalUsers, totalTags, tapsToday, tapsWeek, tapsMonth, totalTaps, dailyTaps });
}
