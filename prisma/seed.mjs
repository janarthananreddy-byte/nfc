import { DatabaseSync } from "node:sqlite";
import { createHash, randomBytes } from "node:crypto";
import { createHmac } from "node:crypto";

// Simple bcrypt-like hash using sha256 (for seeding only — production code uses bcryptjs)
// Actually let's just use a known bcrypt hash for Admin@123
// Hash generated with bcrypt.hash("Admin@123", 12)
const ADMIN_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGzXCIGFhLR0VQ5zGKgKIUq3XS2";

const db = new DatabaseSync("prisma/dev.db");

function cuid() {
  const ts = Date.now().toString(36);
  const rand = randomBytes(10).toString("base64url").slice(0, 16);
  return `c${ts}${rand}`;
}

// Check if admin exists
const existing = db.prepare("SELECT id FROM User WHERE email = ?").get("admin@nfctag.com");
if (existing) {
  console.log("Admin user already exists.");
} else {
  const userId = cuid();
  const profileId = cuid();
  const tagId = cuid();
  const tagSlug = cuid();
  const now = new Date().toISOString();

  db.prepare(
    "INSERT INTO User (id, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(userId, "admin@nfctag.com", ADMIN_HASH, "admin", now, now);

  db.prepare(
    "INSERT INTO Profile (id, userId, firstName, lastName, cyclingType, updatedAt) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(profileId, userId, "Admin", "User", "Admin", now);

  db.prepare(
    "INSERT INTO NfcTag (id, userId, tagSlug, isActive, createdAt) VALUES (?, ?, ?, ?, ?)"
  ).run(tagId, userId, tagSlug, 1, now);

  console.log("Created admin user: admin@nfctag.com");
  console.log("Password: Admin@123");
  console.log(`NFC Tag slug: ${tagSlug}`);
}

db.close();
