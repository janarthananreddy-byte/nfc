// SendGrid Web API mailer. Railway blocks outbound SMTP ports,
// so we send via SendGrid's HTTPS API instead of nodemailer/SMTP.

function parseFrom(raw: string): { email: string; name: string } {
  const m = raw.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (m) return { name: m[1] || "", email: m[2] };
  return { name: "", email: raw.trim() };
}

export async function sendOtpEmail(email: string, otp: string) {
  const apiKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASS || "";
  const from = parseFrom(process.env.SMTP_FROM || "NFC Emergency ID <noreply@nfcid.com>");

  const text =
    "Your login code is: " + otp + "\n\n" +
    "This code expires in 10 minutes.\n" +
    "If you did not request this, ignore this email.";

  const html =
    '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#faf9f7;border-radius:16px;border:1px solid #e7e4df">' +
    '<h2 style="margin:0 0 16px;font-size:20px;color:#16140f;text-align:center">Your Login Code</h2>' +
    '<div style="background:#fff;border-radius:12px;border:1.5px solid #e7e4df;padding:24px;text-align:center">' +
    '<p style="margin:0 0 12px;color:#6b6660;font-size:13px;letter-spacing:.1em">ONE-TIME CODE</p>' +
    '<div style="font-size:40px;font-weight:900;letter-spacing:.2em;color:#16140f">' + otp + '</div>' +
    '<p style="margin:12px 0 0;color:#8a857c;font-size:12px">Expires in 10 minutes</p>' +
    '</div>' +
    '<p style="margin:16px 0 0;color:#8a857c;font-size:12px;text-align:center">If you did not request this code, you can safely ignore this email.</p>' +
    '</div>';

  if (!apiKey) {
    console.log("\n========== OTP FOR " + email + " ==========");
    console.log("Code: " + otp);
    console.log("======================================\n");
    return;
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: email }] }],
      from: from.name ? { email: from.email, name: from.name } : { email: from.email },
      subject: otp + " - Your NFC Emergency ID Login Code",
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error("SendGrid API error " + res.status + ": " + body);
  }
}
