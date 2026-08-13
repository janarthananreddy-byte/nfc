import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/authz";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";
async function guard() { const s = await getServerSession(authOptions); return s && isAdmin(s.user.role) ? s : null; }

export async function GET() {
  const s = await guard(); if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const statuses = await prisma.statusConfig.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json({ statuses });
}
export async function POST(req: Request) {
  const s = await guard(); if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  const key = (b.key || "").toUpperCase().replace(/[^A-Z0-9_]/g, "_");
  if (!key || !b.label) return NextResponse.json({ error: "Key and label required" }, { status: 400 });
  const count = await prisma.statusConfig.count();
  const st = await prisma.statusConfig.create({ data: { key, label: b.label, color: b.color || "#64748b", order: count + 1, isClosedState: !!b.isClosedState } });
  await logAudit({ actorEmail: s.user.email || "", action: "status_created", targetType: "status", targetId: st.id, targetLabel: st.label });
  return NextResponse.json({ status: st }, { status: 201 });
}
export async function PATCH(req: Request) {
  const s = await guard(); if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const data: Record<string, unknown> = {};
  ["label", "color", "order", "isClosedState", "active"].forEach((k) => { if (b[k] !== undefined) data[k] = b[k]; });
  const st = await prisma.statusConfig.update({ where: { id: b.id }, data });
  return NextResponse.json({ status: st });
}
