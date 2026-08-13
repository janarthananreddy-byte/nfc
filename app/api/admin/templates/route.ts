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
  const templates = await prisma.notificationTemplate.findMany({ orderBy: { key: "asc" } });
  return NextResponse.json({ templates });
}
export async function PATCH(req: Request) {
  const s = await guard(); if (!s) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const b = await req.json();
  if (!b.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const data: Record<string, unknown> = {};
  ["subject", "body", "channel", "active"].forEach((k) => { if (b[k] !== undefined) data[k] = b[k]; });
  const tpl = await prisma.notificationTemplate.update({ where: { id: b.id }, data });
  await logAudit({ actorEmail: s.user.email || "", action: "template_updated", targetType: "template", targetId: tpl.id, targetLabel: tpl.key });
  return NextResponse.json({ template: tpl });
}
