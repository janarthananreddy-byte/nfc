/**
 * First-time setup — works on Node 18+
 * Uses @libsql/client (already installed) — no Node 22 required.
 * Run: node setup.mjs
 */

import { createClient } from "@libsql/client";

console.log("NFC Emergency ID — Setup\n");

const client = createClient({ url: process.env.DATABASE_URL || "file:dev.db" });

// ---------- Schema ----------
await client.executeMultiple(`
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "User" (
  "id"        TEXT     NOT NULL PRIMARY KEY,
  "email"     TEXT     NOT NULL,
  "role"      TEXT     NOT NULL DEFAULT 'user',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");

CREATE TABLE IF NOT EXISTS "Profile" (
  "id"               TEXT     NOT NULL PRIMARY KEY,
  "userId"           TEXT     NOT NULL,
  "firstName"        TEXT     NOT NULL DEFAULT '',
  "lastName"         TEXT     NOT NULL DEFAULT '',
  "age"              INTEGER,
  "cyclingType"      TEXT     NOT NULL DEFAULT 'Road cyclist',
  "clubName"         TEXT     NOT NULL DEFAULT '',
  "clubId"           TEXT     NOT NULL DEFAULT '',
  "clubContactName"  TEXT     NOT NULL DEFAULT '',
  "clubContactPhone" TEXT     NOT NULL DEFAULT '',
  "clubContactEmail" TEXT     NOT NULL DEFAULT '',
  "bloodType"        TEXT     NOT NULL DEFAULT '',
  "photoUrl"         TEXT,
  "updatedAt"        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "Profile_userId_key" ON "Profile"("userId");

CREATE TABLE IF NOT EXISTS "EmergencyContact" (
  "id"           TEXT     NOT NULL PRIMARY KEY,
  "profileId"    TEXT     NOT NULL,
  "name"         TEXT     NOT NULL,
  "relationship" TEXT     NOT NULL,
  "phone"        TEXT     NOT NULL,
  "isPrimary"    INTEGER  NOT NULL DEFAULT 0,
  "sortOrder"    INTEGER  NOT NULL DEFAULT 0,
  "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "ShippingAddress" (
  "id"        TEXT     NOT NULL PRIMARY KEY,
  "userId"    TEXT     NOT NULL,
  "fullName"  TEXT     NOT NULL,
  "address1"  TEXT     NOT NULL,
  "address2"  TEXT     NOT NULL DEFAULT '',
  "city"      TEXT     NOT NULL,
  "state"     TEXT     NOT NULL,
  "zipCode"   TEXT     NOT NULL,
  "country"   TEXT     NOT NULL DEFAULT 'India',
  "phone"     TEXT     NOT NULL DEFAULT '',
  "isDefault" INTEGER  NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "NfcTag" (
  "id"        TEXT     NOT NULL PRIMARY KEY,
  "userId"    TEXT     NOT NULL,
  "tagSlug"   TEXT     NOT NULL,
  "isActive"  INTEGER  NOT NULL DEFAULT 1,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "NfcTag_userId_key"  ON "NfcTag"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "NfcTag_tagSlug_key" ON "NfcTag"("tagSlug");

CREATE TABLE IF NOT EXISTS "NfcTap" (
  "id"        TEXT     NOT NULL PRIMARY KEY,
  "tagId"     TEXT     NOT NULL,
  "ipAddress" TEXT     NOT NULL DEFAULT '',
  "userAgent" TEXT     NOT NULL DEFAULT '',
  "tappedAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tagId") REFERENCES "NfcTag"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "OtpToken" (
  "id"        TEXT     NOT NULL PRIMARY KEY,
  "email"     TEXT     NOT NULL,
  "otp"       TEXT     NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "used"      INTEGER  NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);
console.log("✓ Database schema ready");

// ---------- Seed admin ----------
const { rows } = await client.execute({
  sql: "SELECT id FROM User WHERE email = ?",
  args: ["admin@nfctag.com"],
});

if (rows.length === 0) {
  const now = new Date().toISOString();

  await client.batch([
    {
      sql:  "INSERT OR IGNORE INTO User (id, email, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)",
      args: ["admin001", "admin@nfctag.com", "admin", now, now],
    },
    {
      sql:  "INSERT OR IGNORE INTO Profile (id, userId, firstName, lastName, cyclingType, updatedAt) VALUES (?, ?, ?, ?, ?, ?)",
      args: ["profile001", "admin001", "Admin", "User", "Admin", now],
    },
    {
      sql:  "INSERT OR IGNORE INTO NfcTag (id, userId, tagSlug, isActive, createdAt) VALUES (?, ?, ?, ?, ?)",
      args: ["tag001", "admin001", "admin-demo-tag-001", 1, now],
    },
  ], "write");

  console.log("✓ Admin user created");
  console.log("  Email : admin@nfctag.com");
  console.log("  Login : OTP sent to email on first sign-in");
} else {
  console.log("✓ Admin user already exists");
}

console.log("\nSetup complete! Next: npm run build  →  npm start\n");
