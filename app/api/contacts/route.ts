import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) return NextResponse.json([]);

  const contacts = await prisma.emergencyContact.findMany({
    where: { profileId: profile.id },
    orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
  });
  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, relationship, phone, isPrimary } = body;

  let profile = await prisma.profile.findUnique({ where: { userId: session.user.id } });
  if (!profile) {
    profile = await prisma.profile.create({ data: { userId: session.user.id } });
  }

  if (isPrimary) {
    await prisma.emergencyContact.updateMany({
      where: { profileId: profile.id },
      data: { isPrimary: false },
    });
  }

  const count = await prisma.emergencyContact.count({ where: { profileId: profile.id } });
  const contact = await prisma.emergencyContact.create({
    data: { profileId: profile.id, name, relationship, phone, isPrimary: !!isPrimary, sortOrder: count },
  });

  return NextResponse.json(contact, { status: 201 });
}
