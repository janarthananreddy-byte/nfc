import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const TABLES: { name: string; count: () => Promise<number> }[] = [
  { name: "User", count: () => prisma.user.count() },
  { name: "Profile", count: () => prisma.profile.count() },
  { name: "EmergencyContact", count: () => prisma.emergencyContact.count() },
  { name: "ShippingAddress", count: () => prisma.shippingAddress.count() },
  { name: "NfcTag", count: () => prisma.nfcTag.count() },
  { name: "NfcTap", count: () => prisma.nfcTap.count() },
  { name: "OtpToken", count: () => prisma.otpToken.count() },
  { name: "Setting", count: () => prisma.setting.count() },
  { name: "Order", count: () => prisma.order.count() },
  { name: "AuditLog", count: () => prisma.auditLog.count() },
];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const counts = await Promise.all(TABLES.map((t) => t.count()));

  const sizeByTable: Record<string, number> = {};
  let totalBytes: number | null = null;
  try {
    const rows = (await prisma.$queryRawUnsafe(
      "SELECT name, SUM(pgsize) as bytes FROM dbstat GROUP BY name"
    )) as { name: string; bytes: number | bigint }[];
    for (const r of rows) {
      const bytes = Number(r.bytes) || 0;
      for (const t of TABLES) {
        if (
          r.name === t.name ||
          r.name.startsWith(t.name + "_") ||
          r.name.startsWith("sqlite_autoindex_" + t.name)
        ) {
          sizeByTable[t.name] = (sizeByTable[t.name] || 0) + bytes;
        }
      }
    }
    totalBytes = rows.reduce((sum, r) => sum + (Number(r.bytes) || 0), 0);
  } catch {
    // dbstat virtual table not available on this build
  }

  const tables = TABLES.map((t, i) => ({
    name: t.name,
    rows: counts[i],
    bytes: sizeByTable[t.name] ?? null,
  }));

  return NextResponse.json({ tables, totalBytes });
}
