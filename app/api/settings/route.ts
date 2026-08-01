import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  tag_price: "499",
  upi_id: "",
  payee_name: "NFC Emergency ID",
  session_timeout: "30",
};

async function readSettings() {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = { ...DEFAULTS };
  for (const r of rows) map[r.key] = r.value;
  return {
    tagPrice: Number(map.tag_price) || 0,
    upiId: map.upi_id || "",
    payeeName: map.payee_name || "NFC Emergency ID",
    sessionTimeout: Number(map.session_timeout) || 30,
  };
}

export async function GET() {
  return NextResponse.json(await readSettings());
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const updates: Record<string, string> = {};
  if (body.tagPrice !== undefined) updates.tag_price = String(Math.max(0, parseInt(body.tagPrice) || 0));
  if (body.upiId !== undefined) updates.upi_id = String(body.upiId).trim();
  if (body.payeeName !== undefined) updates.payee_name = String(body.payeeName).trim();
  if (body.sessionTimeout !== undefined) updates.session_timeout = String(Math.min(1440, Math.max(1, parseInt(body.sessionTimeout) || 30)));

  for (const [key, value] of Object.entries(updates)) {
    await prisma.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }
  return NextResponse.json(await readSettings());
}
