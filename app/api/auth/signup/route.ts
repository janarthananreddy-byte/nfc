import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mailer";
import { logAudit } from "@/lib/audit";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email, firstName, lastName } = await req.json();

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered. Please sign in instead." }, { status: 409 });
    }

    const created = await prisma.user.create({
      data: {
        email,
        role: "user",
        profile: { create: { firstName: firstName || "", lastName: lastName || "" } },
        nfcTag:  { create: { isActive: false } },
      },
    });

    await logAudit({ actorEmail: email, action: "user_created", targetType: "user", targetId: created.id, targetLabel: email, details: "New account registered" });

    // Invalidate old OTPs and send a fresh one
    await prisma.otpToken.updateMany({ where: { email, used: false }, data: { used: true } });
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.otpToken.create({ data: { email, otp, expiresAt } });

    await sendOtpEmail(email, otp);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
