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
  const body = await req.json();
  const { orderId, status, trackingId, trackingUrl } = body;
  if (!orderId) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const data: Record<string, string> = {};
  if (status !== undefined) {
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = status;
  }
  if (trackingId !== undefined) data.trackingId = String(trackingId);
  if (trackingUrl !== undefined) data.trackingUrl = String(trackingUrl);
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.order.update({ where: { id: orderId }, data });

  if (status !== undefined) {
    await logAudit({
      actorEmail: session.user.email || "",
      action: "order_status_changed",
      targetType: "order",
      targetId: orderId,
      targetLabel: updated.orderNo || orderId,
      details: `Order status changed to ${status}`,
    });
  }
  if (trackingId !== undefined || trackingUrl !== undefined) {
    await logAudit({
      actorEmail: session.user.email || "",
      action: "order_tracking_set",
      targetType: "order",
      targetId: orderId,
      targetLabel: updated.orderNo || orderId,
      details: `Tracking set: ${updated.trackingId || "-"} ${updated.trackingUrl || ""}`.trim(),
    });
  }
  return NextResponse.json(updated);
}
