import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOtpEmail } from "@/lib/mailer";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  const { email, context } = await req.json() as { email: string; context: "login" | "signup" };

  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });

  if (context === "login" && !user) {
    return NextResponse.json({ error: "No account found with this email. Please sign up first." }, { status: 404 });
  }
  if (context === "signup" && user) {
    return NextResponse.json({ error: "Email already registered. Please sign in instead." }, { status: 409 });
  }

  // Invalidate existing unused OTPs for this email
  await prisma.otpToken.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.otpToken.create({ data: { email, otp, expiresAt } });

  try {
    await sendOtpEmail(email, otp);
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    return NextResponse.json({ error: "Failed to send OTP. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
