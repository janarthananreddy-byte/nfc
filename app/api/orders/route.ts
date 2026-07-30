import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getTagPrice(): Promise<number> {
  const row = await prisma.setting.findUnique({ where: { key: "tag_price" } });
  return row ? Number(row.value) || 0 : 499;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const quantity = Math.max(1, parseInt(body.quantity) || 1);
  const s = body.shipping || {};
  const upiTxnId = String(body.upiTxnId || "").trim();

  if (!s.fullName || !s.address1 || !s.city || !s.state || !s.zipCode) {
    return NextResponse.json({ error: "Please complete the shipping address" }, { status: 400 });
  }
  if (!upiTxnId) {
    return NextResponse.json({ error: "Please enter the UPI transaction ID" }, { status: 400 });
  }

  const unitPrice = await getTagPrice();
  const totalAmount = unitPrice * quantity;

  const order = await prisma.order.create({
    data: {
      userId: session.user.id,
      quantity,
      unitPrice,
      totalAmount,
      fullName: s.fullName,
      address1: s.address1,
      address2: s.address2 || "",
      city: s.city,
      state: s.state,
      zipCode: s.zipCode,
      country: s.country || "India",
      phone: s.phone || "",
      status: "payment_review",
      upiTxnId,
    },
  });

  return NextResponse.json(order, { status: 201 });
}
