import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const STATUSES = ["payment_review", "confirmed", "shipped", "delivered", "cancelled"];

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({ orderBy: { createdAt: "desc" } });
  const userIds = [...new Set(orders.map((o) => o.userId))];
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, email: true } });
  const emailById: Record<string, string> = {};
  for (const u of users) emailById[u.id] = u.email;

  return NextResponse.json(orders.map((o) => ({ ...o, email: emailById[o.userId] || "unknown" })));
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { orderId, status } = await req.json();
  if (!orderId || !STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const updated = await prisma.order.update({ where: { id: orderId }, data: { status } });
  await logAudit({
    actorEmail: session.user.email || "",
    action: "order_status_changed",
    targetType: "order",
    targetId: orderId,
    targetLabel: updated.orderNo || orderId,
    details: `Order status → ${status}`,
  });
  return NextResponse.json(updated);
}
