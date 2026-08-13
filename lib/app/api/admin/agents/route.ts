import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const [agents, teams, categories, statuses] = await Promise.all([
    prisma.user.findMany({ where: { role: { in: ["agent", "admin"] } }, select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } } }),
    prisma.supportTeam.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }], select: { id: true, name: true, parentId: true } }),
    prisma.statusConfig.findMany({ where: { active: true }, orderBy: { order: "asc" }, select: { key: true, label: true } }),
  ]);
  return NextResponse.json({ agents, teams, categories, statuses });
}
