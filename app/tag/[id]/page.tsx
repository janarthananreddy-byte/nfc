import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TapRecorder } from "./TapRecorder";

export const dynamic = "force-dynamic";

export default async function TagPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const tag = await prisma.nfcTag.findUnique({
    where: { tagSlug: id },
    include: {
      user: {
        include: {
          profile: {
            include: {
              contacts: { orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }] },
            },
          },
        },
      },
    },
  });

  if (!tag || !tag.isActive || !tag.user.profile) notFound();

  const p = tag.user.profile;
  const fullName = `${p.firstName} ${p.lastName}`.trim() || "Cyclist";
  const primaryContact = p.contacts.find((c) => c.isPrimary);
  const otherContacts = p.contacts.filter((c) => !c.isPrimary);

  return (
    <>
      <TapRecorder tagSlug={id} />
      <div style={{ minHeight: "100vh", width: "100%", background: "#faf9f7", display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "480px", minHeight: "100vh", background: "#faf9f7", overflow: "hidden" }}>


          {/* Scanned indicator */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", padding: "14px 24px 6px", position: "relative", zIndex: 4 }}>
            <span style={{ font: "700 11px 'Space Mono',monospace", letterSpacing: ".1em", color: "#e11900" }}>TAG SCANNED</span>
          </div>

          {/* Red alert header */}
          <div style={{ background: "#e11900", padding: "14px 24px 28px", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", font: "700 12px 'Space Mono',monospace", letterSpacing: ".18em" }}>
              <span className="animate-scanpulse" style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#fff", display: "inline-block" }}></span>
              EMERGENCY CONTACT DETAILS
            </div>
          </div>

          {/* Identity */}
          <div style={{ padding: "0 24px", marginTop: "-22px", display: "flex", alignItems: "flex-end", gap: "16px" }}>
            <div style={{ width: "96px", height: "96px", borderRadius: "20px", flex: "none", border: "4px solid #faf9f7", boxShadow: "0 6px 18px rgba(0,0,0,.18)", background: p.photoUrl ? "none" : "repeating-linear-gradient(135deg,#e6e2db 0 8px,#dcd7cf 8px 16px)", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", overflow: "hidden" }}>
              {p.photoUrl ? (
                <img src={p.photoUrl} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ font: "700 8px 'Space Mono',monospace", color: "#8a857c", letterSpacing: ".05em" }}>CYCLIST<br />PHOTO</span>
              )}
            </div>
            <div style={{ paddingBottom: "6px" }}>
              <div style={{ font: "800 25px/1 'Archivo',sans-serif", color: "#16140f", letterSpacing: "-.02em" }}>{fullName}</div>
              <div style={{ marginTop: "5px", font: "500 14px 'Archivo',sans-serif", color: "#6b6660" }}>
                {p.age ? `Age ${p.age}` : ""}{p.age && p.cyclingType ? " · " : ""}{p.cyclingType}
              </div>
              {(p.clubName || p.clubId) && (
                <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  {p.clubName && <span style={{ font: "700 12px 'Archivo',sans-serif", color: "#16140f" }}>{p.clubName}</span>}
                  {p.clubId && <span style={{ font: "700 11px 'Space Mono',monospace", color: "#e11900", background: "#fdece9", padding: "2px 8px", borderRadius: "6px", letterSpacing: ".06em" }}>{p.clubId}</span>}
                </div>
              )}
            </div>
          </div>

          {/* Club Contact */}
          {(p.clubContactName || p.clubContactPhone) && (
            <div style={{ margin: "16px 24px 0", padding: "14px 18px", border: "1.5px solid #e7e4df", borderRadius: "18px", background: "#fff" }}>
              <div style={{ font: "700 10px 'Space Mono',monospace", letterSpacing: ".14em", color: "#6b6660", marginBottom: "8px" }}>CLUB CONTACT</div>
              {p.clubContactName && <div style={{ font: "700 15px 'Archivo',sans-serif", color: "#16140f" }}>{p.clubContactName}</div>}
              {p.clubContactPhone && (
                <a href={`tel:${p.clubContactPhone}`} style={{ display: "block", font: "500 13px 'Space Mono',monospace", color: "#e11900", marginTop: "4px", textDecoration: "none" }}>{p.clubContactPhone}</a>
              )}
              {p.clubContactEmail && (
                <a href={`mailto:${p.clubContactEmail}`} style={{ display: "block", font: "500 12px 'Archivo',sans-serif", color: "#6b6660", marginTop: "2px", textDecoration: "none" }}>{p.clubContactEmail}</a>
              )}
            </div>
          )}

          {/* Blood type */}
          {p.bloodType && (
            <div style={{ margin: "22px 24px 0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", border: "2px solid #e11900", borderRadius: "18px", background: "#fff" }}>
              <div style={{ font: "700 11px 'Space Mono',monospace", letterSpacing: ".14em", color: "#e11900" }}>BLOOD TYPE</div>
              <div style={{ font: "900 34px 'Archivo',sans-serif", color: "#16140f", lineHeight: 1 }}>
                {p.bloodType.replace("+", "")}<span style={{ color: "#e11900" }}>{p.bloodType.includes("+") ? "+" : p.bloodType.includes("-") ? "-" : ""}</span>
              </div>
            </div>
          )}

          {/* Contacts */}
          <div style={{ padding: "24px 24px 28px" }}>
            <div style={{ font: "700 11px 'Space Mono',monospace", letterSpacing: ".14em", color: "#6b6660", marginBottom: "12px" }}>EMERGENCY CONTACTS</div>

            {primaryContact && (
              <a href={`tel:${primaryContact.phone}`} className="animate-ring" style={{ display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", background: "#e11900", borderRadius: "18px", padding: "16px 18px", marginBottom: "10px" }}>
                <span style={{ width: "46px", height: "46px", borderRadius: "50%", flex: "none", background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PhoneIcon color="#fff" />
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", font: "700 17px 'Archivo',sans-serif", color: "#fff" }}>{primaryContact.name}</span>
                  <span style={{ display: "block", font: "500 12px 'Space Mono',monospace", color: "rgba(255,255,255,.82)", marginTop: "2px" }}>{primaryContact.relationship.toUpperCase()} · PRIMARY</span>
                </span>
                <span style={{ font: "700 13px 'Space Mono',monospace", color: "#fff", letterSpacing: ".06em" }}>CALL</span>
              </a>
            )}

            {otherContacts.map((c) => (
              <a key={c.id} href={`tel:${c.phone}`} style={{ display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", background: "#fff", border: "1.5px solid #e7e4df", borderRadius: "18px", padding: "14px 18px", marginBottom: "10px" }}>
                <span style={{ width: "46px", height: "46px", borderRadius: "50%", flex: "none", background: "#fdece9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PhoneIcon color="#e11900" size={20} />
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ display: "block", font: "700 17px 'Archivo',sans-serif", color: "#16140f" }}>{c.name}</span>
                  <span style={{ display: "block", font: "500 12px 'Space Mono',monospace", color: "#8a857c", marginTop: "2px" }}>{c.relationship.toUpperCase()}</span>
                </span>
                <span style={{ font: "700 13px 'Space Mono',monospace", color: "#e11900", letterSpacing: ".06em" }}>CALL</span>
              </a>
            ))}

            {p.contacts.length === 0 && (
              <div style={{ padding: "20px", textAlign: "center", color: "#8a857c", font: "500 14px 'Archivo',sans-serif" }}>No emergency contacts added</div>
            )}

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "4px 0 12px" }}>
              <div style={{ flex: 1, height: "1px", background: "#e7e4df" }}></div>
              <span style={{ font: "700 10px 'Space Mono',monospace", letterSpacing: ".12em", color: "#b0a99f" }}>DEFAULT</span>
              <div style={{ flex: 1, height: "1px", background: "#e7e4df" }}></div>
            </div>

            {/* Emergency Services */}
            <a href="tel:108" style={{ display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", background: "#16140f", borderRadius: "18px", padding: "16px 18px", marginBottom: "10px" }}>
              <span style={{ width: "46px", height: "46px", borderRadius: "50%", flex: "none", background: "rgba(225,29,0,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <PhoneIcon color="#e11900" />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: "700 17px 'Archivo',sans-serif", color: "#fff" }}>Emergency Services</span>
                <span style={{ display: "block", font: "500 12px 'Space Mono',monospace", color: "#8a857c", marginTop: "2px" }}>AMBULANCE · 108</span>
              </span>
              <span style={{ font: "900 22px 'Archivo',sans-serif", color: "#e11900", letterSpacing: "-.01em" }}>108</span>
            </a>

            <a href="tel:100" style={{ display: "flex", alignItems: "center", gap: "14px", textDecoration: "none", background: "#16140f", borderRadius: "18px", padding: "16px 18px" }}>
              <span style={{ width: "46px", height: "46px", borderRadius: "50%", flex: "none", background: "rgba(225,29,0,.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ShieldIcon />
              </span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", font: "700 17px 'Archivo',sans-serif", color: "#fff" }}>Police</span>
                <span style={{ display: "block", font: "500 12px 'Space Mono',monospace", color: "#8a857c", marginTop: "2px" }}>POLICE · 100</span>
              </span>
              <span style={{ font: "900 22px 'Archivo',sans-serif", color: "#e11900", letterSpacing: "-.01em" }}>100</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );
}

function PhoneIcon({ color = "#fff", size = 22 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e11900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
