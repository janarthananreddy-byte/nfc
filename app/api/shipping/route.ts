import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const address = await prisma.shippingAddress.findFirst({
    where: { userId: session.user.id, isDefault: true },
  });
  return NextResponse.json(address);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { fullName, address1, address2, city, state, zipCode, country, phone } = body;

  if (!fullName || !address1 || !city || !state || !zipCode) {
    return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 });
  }

  await prisma.shippingAddress.updateMany({
    where: { userId: session.user.id },
    data: { isDefault: false },
  });

  const address = await prisma.shippingAddress.create({
    data: { userId: session.user.id, fullName, address1, address2: address2 || "", city, state, zipCode, country: country || "India", phone: phone || "", isDefault: true },
  });

  return NextResponse.json(address, { status: 201 });
}
