import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { contacts: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
  });

  const tag = await prisma.nfcTag.findUnique({ where: { userId: session.user.id } });

  return NextResponse.json({ profile, tag });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, age, cyclingType, clubName, clubId, bloodType, photoUrl } = body;

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: { firstName, lastName, age: age ? parseInt(age) : null, cyclingType, clubName, clubId, bloodType, photoUrl },
    create: { userId: session.user.id, firstName, lastName, age: age ? parseInt(age) : null, cyclingType, clubName, clubId, bloodType, photoUrl },
  });

  return NextResponse.json(profile);
}
