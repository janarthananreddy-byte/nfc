import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const FIELD_LABELS: Record<string, string> = {
  firstName: "First name",
  lastName: "Last name",
  age: "Age",
  cyclingType: "Cycling type",
  clubName: "Club name",
  clubId: "Club ID",
  clubContactName: "Club contact name",
  clubContactPhone: "Club contact phone",
  clubContactEmail: "Club contact email",
  bloodType: "Blood type",
  photoUrl: "Photo",
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findUnique({
    where: { userId: session.user.id },
    include: { contacts: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] } },
  });

  const tag = await prisma.nfcTag.findUnique({ where: { userId: session.user.id } });

  const tapCount = tag ? await prisma.nfcTap.count({ where: { tagId: tag.id } }) : 0;

  return NextResponse.json({ profile, tag, tapCount });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { firstName, lastName, age, cyclingType, clubName, clubId, clubContactName, clubContactPhone, clubContactEmail, bloodType, photoUrl } = body;

  const existing = await prisma.profile.findUnique({ where: { userId: session.user.id } });

  const nextData = {
    firstName, lastName, age: age ? parseInt(age) : null, cyclingType,
    clubName, clubId, clubContactName, clubContactPhone, clubContactEmail, bloodType, photoUrl,
  };

  const profile = await prisma.profile.upsert({
    where: { userId: session.user.id },
    update: nextData,
    create: { userId: session.user.id, ...nextData },
  });

  // Build a list of changed fields for the audit trail
  const changes: string[] = [];
  for (const key of Object.keys(FIELD_LABELS)) {
    const before = existing ? (existing as Record<string, unknown>)[key] : undefined;
    const after = (profile as Record<string, unknown>)[key];
    const b = before === null || before === undefined ? "" : String(before);
    const a = after === null || after === undefined ? "" : String(after);
    if (b !== a) changes.push(`${FIELD_LABELS[key]}: "${b}" → "${a}"`);
  }

  if (changes.length > 0) {
    await logAudit({
      actorEmail: session.user.email || "",
      action: existing ? "profile_updated" : "profile_created",
      targetType: "user",
      targetId: session.user.id,
      targetLabel: session.user.email || session.user.id,
      details: changes.join("; "),
    });
  }

  return NextResponse.json(profile);
}
