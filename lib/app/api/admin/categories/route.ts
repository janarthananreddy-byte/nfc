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
  const categories = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return NextResponse.json({ categories });
}
export async function POST(req: Request) {
  const s = await guard(); if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
  const c = await prisma.category.create({ data: { name: b.name, type: b.type || "", parentId: b.parentId || null, sortOrder: b.sortOrder || 0 } });
  await logAudit({ actorEmail: s.user.email || "", action: "category_created", targetType: "category", targetId: c.id, targetLabel: c.name });
  return NextResponse.json({ category: c }, { status: 201 });
}
export async function PATCH(req: Request) {
  const s = await guard(); if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const data: Record<string, unknown> = {};
  ["name", "type", "sortOrder", "active"].forEach((k) => { if (b[k] !== undefined) data[k] = b[k]; });
  const c = await prisma.category.update({ where: { id: b.id }, data });
  await logAudit({ actorEmail: s.user.email || "", action: "category_updated", targetType: "category", targetId: c.id, targetLabel: c.name });
  return NextResponse.json({ category: c });
}
