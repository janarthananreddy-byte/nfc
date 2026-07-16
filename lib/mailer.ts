import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
  });
}

export async function sendOtpEmail(email: string, otp: string) {
  const from = process.env.SMTP_FROM || "NFC Emergency ID <noreply@nfcid.com>";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#faf9f7;border-radius:16px;border:1px solid #e7e4df">
      <div style="text-align:center;margin-bottom:24px">
        <div style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:50%;background:#e11900">
          <span style="color:#fff;font-size:22px">🚴</span>
        </div>
        <h2 style="margin:16px 0 4px;font-size:20px;color:#16140f">Your Login Code</h2>
        <p style="margin:0;color:#6b6660;font-size:14px">NFC Emergency ID</p>
      </div>
      <div style="background:#fff;border-radius:12px;border:1.5px solid #e7e4df;padding:24px;text-align:center;margin-bottom:20px">
        <p style="margin:0 0 12px;color:#6b6660;font-size:13px;font-family:'Courier New',monospace;letter-spacing:.1em">ONE-TIME CODE</p>
        <div style="font-size:40px;font-weight:900;letter-spacing:.2em;color:#16140f;font-family:'Courier New',monospace">${otp}</div>
        <p style="margin:12px 0 0;color:#8a857c;font-size:12px">Expires in 10 minutes</p>
      </div>
      <p style="margin:0;color:#8a857c;font-size:12px;text-align:center">If you didn't request this code, you can safely ignore this email.</p>
    </div>
  `;

  const transporter = createTransporter();

  if (!transporter) {
    // No SMTP configured — log to console (dev / first-run)
    console.log(`\n========== OTP FOR ${email} ==========`);
    console.log(`Code: ${otp}`);
    console.log(`======================================\n`);
    return;
  }

  await transporter.sendMail({
    from,
    to: email,
    subject: `${otp} — Your NFC Emergency ID Login Code`,
    html,
    text: `Your login code is: ${otp}\n\nThis code expires in 10 minutes.\nIf you didn't request this, ignore this email.`,
  });
}
