import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [signups, taps, contacted] = await Promise.all([
      prisma.user.count(),
      prisma.nfcTap.count(),
      prisma.tagCall.count(),
    ]);
    return NextResponse.json({ signups, taps, contacted });
  } catch {
    return NextResponse.json({ signups: 0, taps: 0, contacted: 0 });
  }
}
