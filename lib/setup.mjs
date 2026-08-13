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
  "mobile"           TEXT     NOT NULL DEFAULT '',
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
  "preferredCourier" TEXT NOT NULL DEFAULT '',
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
  "latitude"  TEXT     NOT NULL DEFAULT '',
  "longitude" TEXT     NOT NULL DEFAULT '',
  "helperPhoto" TEXT   NOT NULL DEFAULT '',
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

CREATE TABLE IF NOT EXISTS "Setting" (
  "key"   TEXT NOT NULL PRIMARY KEY,
  "value" TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id"          TEXT     NOT NULL PRIMARY KEY,
  "actorEmail"  TEXT     NOT NULL DEFAULT '',
  "action"      TEXT     NOT NULL,
  "targetType"  TEXT     NOT NULL DEFAULT '',
  "targetId"    TEXT     NOT NULL DEFAULT '',
  "targetLabel" TEXT     NOT NULL DEFAULT '',
  "details"     TEXT     NOT NULL DEFAULT '',
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Order" (
  "id"          TEXT     NOT NULL PRIMARY KEY,
  "orderNo"     TEXT     NOT NULL DEFAULT '',
  "userId"      TEXT     NOT NULL,
  "quantity"    INTEGER  NOT NULL DEFAULT 1,
  "unitPrice"   INTEGER  NOT NULL DEFAULT 0,
  "totalAmount" INTEGER  NOT NULL DEFAULT 0,
  "fullName"    TEXT     NOT NULL DEFAULT '',
  "address1"    TEXT     NOT NULL DEFAULT '',
  "address2"    TEXT     NOT NULL DEFAULT '',
  "city"        TEXT     NOT NULL DEFAULT '',
  "state"       TEXT     NOT NULL DEFAULT '',
  "zipCode"     TEXT     NOT NULL DEFAULT '',
  "country"     TEXT     NOT NULL DEFAULT 'India',
  "phone"       TEXT     NOT NULL DEFAULT '',
  "status"      TEXT     NOT NULL DEFAULT 'payment_review',
  "upiTxnId"    TEXT     NOT NULL DEFAULT '',
  "trackingId"  TEXT     NOT NULL DEFAULT '',
  "trackingUrl" TEXT     NOT NULL DEFAULT '',
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "TagCall" (
  "id"           TEXT     NOT NULL PRIMARY KEY,
  "tagId"        TEXT     NOT NULL,
  "contactName"  TEXT     NOT NULL DEFAULT '',
  "relationship" TEXT     NOT NULL DEFAULT '',
  "phone"        TEXT     NOT NULL DEFAULT '',
  "latitude"     TEXT     NOT NULL DEFAULT '',
  "longitude"    TEXT     NOT NULL DEFAULT '',
  "ipAddress"    TEXT     NOT NULL DEFAULT '',
  "createdAt"    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tagId") REFERENCES "NfcTag"("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "SupportTeam" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "createdAt"   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Category" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "name"      TEXT NOT NULL,
  "type"      TEXT NOT NULL DEFAULT '',
  "parentId"  TEXT,
  "active"    INTEGER NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "StatusConfig" (
  "id"            TEXT NOT NULL PRIMARY KEY,
  "key"           TEXT NOT NULL,
  "label"         TEXT NOT NULL,
  "color"         TEXT NOT NULL DEFAULT '#64748b',
  "order"         INTEGER NOT NULL DEFAULT 0,
  "isClosedState" INTEGER NOT NULL DEFAULT 0,
  "active"        INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS "StatusConfig_key_key" ON "StatusConfig"("key");

CREATE TABLE IF NOT EXISTS "Ticket" (
  "id"              TEXT NOT NULL PRIMARY KEY,
  "ticketNo"        TEXT NOT NULL,
  "subject"         TEXT NOT NULL,
  "description"     TEXT NOT NULL,
  "priority"        TEXT NOT NULL DEFAULT 'MEDIUM',
  "status"          TEXT NOT NULL DEFAULT 'NEW',
  "requesterId"     TEXT NOT NULL,
  "assignedAgentId" TEXT,
  "assignedTeamId"  TEXT,
  "categoryId"      TEXT,
  "subCategoryId"   TEXT,
  "contactInfo"     TEXT NOT NULL DEFAULT '',
  "referenceNo"     TEXT NOT NULL DEFAULT '',
  "slaDueAt"        DATETIME,
  "firstResponseAt" DATETIME,
  "resolvedAt"      DATETIME,
  "closedAt"        DATETIME,
  "csatRating"      INTEGER,
  "csatComment"     TEXT NOT NULL DEFAULT '',
  "reopenCount"     INTEGER NOT NULL DEFAULT 0,
  "escalated"       INTEGER NOT NULL DEFAULT 0,
  "mergedIntoId"    TEXT,
  "createdAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "Ticket_ticketNo_key" ON "Ticket"("ticketNo");

CREATE TABLE IF NOT EXISTS "TicketComment" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "ticketId"   TEXT NOT NULL,
  "authorId"   TEXT NOT NULL,
  "body"       TEXT NOT NULL,
  "visibility" TEXT NOT NULL DEFAULT 'PUBLIC',
  "kind"       TEXT NOT NULL DEFAULT 'REPLY',
  "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "TicketAttachment" (
  "id"         TEXT NOT NULL PRIMARY KEY,
  "ticketId"   TEXT NOT NULL,
  "commentId"  TEXT,
  "uploaderId" TEXT NOT NULL,
  "filename"   TEXT NOT NULL,
  "mimeType"   TEXT NOT NULL,
  "sizeBytes"  INTEGER NOT NULL,
  "data"       TEXT NOT NULL,
  "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "ticketId"  TEXT,
  "type"      TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "body"      TEXT NOT NULL DEFAULT '',
  "read"      INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "NotificationTemplate" (
  "id"      TEXT NOT NULL PRIMARY KEY,
  "key"     TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body"    TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'IN_APP',
  "active"  INTEGER NOT NULL DEFAULT 1
);
CREATE UNIQUE INDEX IF NOT EXISTS "NotificationTemplate_key_key" ON "NotificationTemplate"("key");

CREATE TABLE IF NOT EXISTS "Counter" (
  "id"  TEXT NOT NULL PRIMARY KEY,
  "seq" INTEGER NOT NULL DEFAULT 0
);

`);
console.log("✓ Database schema ready");

// ---------- Migrations (add columns to existing tables) ----------
try {
  await client.execute("ALTER TABLE \"Order\" ADD COLUMN \"orderNo\" TEXT NOT NULL DEFAULT ''");
} catch {
  // column already exists
}
try {
  await client.execute("ALTER TABLE \"Order\" ADD COLUMN \"trackingId\" TEXT NOT NULL DEFAULT ''");
} catch {
  // column already exists
}
try {
  await client.execute("ALTER TABLE \"Order\" ADD COLUMN \"trackingUrl\" TEXT NOT NULL DEFAULT ''");
} catch {
  // column already exists
}
try {
  await client.execute("ALTER TABLE \"NfcTap\" ADD COLUMN \"latitude\" TEXT NOT NULL DEFAULT ''");
} catch {
  // column already exists
}
try {
  await client.execute("ALTER TABLE \"NfcTap\" ADD COLUMN \"longitude\" TEXT NOT NULL DEFAULT ''");
} catch {
  // column already exists
}
try {
  await client.execute("ALTER TABLE \"NfcTap\" ADD COLUMN \"helperPhoto\" TEXT NOT NULL DEFAULT ''");
} catch {
  // column already exists
}
try {
  await client.execute("ALTER TABLE \"TagCall\" ADD COLUMN \"latitude\" TEXT NOT NULL DEFAULT ''");
} catch {
  // column already exists
}
try {
  await client.execute("ALTER TABLE \"TagCall\" ADD COLUMN \"longitude\" TEXT NOT NULL DEFAULT ''");
} catch {
  // column already exists
}
try {
  await client.execute("ALTER TABLE \"Profile\" ADD COLUMN \"mobile\" TEXT NOT NULL DEFAULT ''");
} catch {
  // column already exists
}
try {
  await client.execute("ALTER TABLE \"ShippingAddress\" ADD COLUMN \"preferredCourier\" TEXT NOT NULL DEFAULT ''");
} catch {
  // column already exists
}
try {
  await client.execute("ALTER TABLE \"User\" ADD COLUMN \"teamId\" TEXT");
} catch {
  // column already exists
}

// ---------- Seed settings ----------
await client.batch([
  { sql: "INSERT OR IGNORE INTO Setting (key, value) VALUES (?, ?)", args: ["tag_price", "499"] },
  { sql: "INSERT OR IGNORE INTO Setting (key, value) VALUES (?, ?)", args: ["upi_id", ""] },
  { sql: "INSERT OR IGNORE INTO Setting (key, value) VALUES (?, ?)", args: ["payee_name", "NFC Emergency ID"] },
  { sql: "INSERT OR IGNORE INTO Setting (key, value) VALUES (?, ?)", args: ["session_timeout", "30"] },
], "write");
console.log("✓ Store settings ready");

// ---------- Seed ticket statuses ----------
await client.batch([
  { sql: "INSERT OR IGNORE INTO StatusConfig (id, key, label, color, \"order\", isClosedState, active) VALUES (?, ?, ?, ?, ?, ?, 1)", args: ["st_new", "NEW", "New", "#3b82f6", 1, 0] },
  { sql: "INSERT OR IGNORE INTO StatusConfig (id, key, label, color, \"order\", isClosedState, active) VALUES (?, ?, ?, ?, ?, ?, 1)", args: ["st_open", "OPEN", "Open", "#6366f1", 2, 0] },
  { sql: "INSERT OR IGNORE INTO StatusConfig (id, key, label, color, \"order\", isClosedState, active) VALUES (?, ?, ?, ?, ?, ?, 1)", args: ["st_prog", "IN_PROGRESS", "In Progress", "#f59e0b", 3, 0] },
  { sql: "INSERT OR IGNORE INTO StatusConfig (id, key, label, color, \"order\", isClosedState, active) VALUES (?, ?, ?, ?, ?, ?, 1)", args: ["st_pend", "PENDING_CUSTOMER", "Pending Customer", "#a855f7", 4, 0] },
  { sql: "INSERT OR IGNORE INTO StatusConfig (id, key, label, color, \"order\", isClosedState, active) VALUES (?, ?, ?, ?, ?, ?, 1)", args: ["st_res", "RESOLVED", "Resolved", "#10b981", 5, 1] },
  { sql: "INSERT OR IGNORE INTO StatusConfig (id, key, label, color, \"order\", isClosedState, active) VALUES (?, ?, ?, ?, ?, ?, 1)", args: ["st_closed", "CLOSED", "Closed", "#64748b", 6, 1] },
], "write");
console.log("✓ Ticket statuses ready");

// ---------- Seed categories ----------
await client.batch([
  { sql: "INSERT OR IGNORE INTO Category (id, name, type, parentId, sortOrder) VALUES (?, ?, ?, NULL, ?)", args: ["cat_hw", "Hardware", "Hardware", 1] },
  { sql: "INSERT OR IGNORE INTO Category (id, name, type, parentId, sortOrder) VALUES (?, ?, ?, NULL, ?)", args: ["cat_sw", "Software", "Software", 2] },
  { sql: "INSERT OR IGNORE INTO Category (id, name, type, parentId, sortOrder) VALUES (?, ?, ?, ?, ?)", args: ["cat_hw_nfc", "NFC TAG", "Hardware", "cat_hw", 1] },
  { sql: "INSERT OR IGNORE INTO Category (id, name, type, parentId, sortOrder) VALUES (?, ?, ?, ?, ?)", args: ["cat_hw_mon", "Monitor", "Hardware", "cat_hw", 2] },
  { sql: "INSERT OR IGNORE INTO Category (id, name, type, parentId, sortOrder) VALUES (?, ?, ?, ?, ?)", args: ["cat_hw_prn", "Printer", "Hardware", "cat_hw", 3] },
  { sql: "INSERT OR IGNORE INTO Category (id, name, type, parentId, sortOrder) VALUES (?, ?, ?, ?, ?)", args: ["cat_hw_net", "Network", "Hardware", "cat_hw", 4] },
  { sql: "INSERT OR IGNORE INTO Category (id, name, type, parentId, sortOrder) VALUES (?, ?, ?, ?, ?)", args: ["cat_sw_app", "Application Issue", "Software", "cat_sw", 1] },
  { sql: "INSERT OR IGNORE INTO Category (id, name, type, parentId, sortOrder) VALUES (?, ?, ?, ?, ?)", args: ["cat_sw_login", "Login Issue", "Software", "cat_sw", 2] },
  { sql: "INSERT OR IGNORE INTO Category (id, name, type, parentId, sortOrder) VALUES (?, ?, ?, ?, ?)", args: ["cat_sw_intg", "Integration Issue", "Software", "cat_sw", 3] },
  { sql: "INSERT OR IGNORE INTO Category (id, name, type, parentId, sortOrder) VALUES (?, ?, ?, ?, ?)", args: ["cat_sw_perf", "Performance Issue", "Software", "cat_sw", 4] },
], "write");
console.log("✓ Categories ready");

// ---------- Seed support team ----------
await client.execute({ sql: "INSERT OR IGNORE INTO SupportTeam (id, name, description) VALUES (?, ?, ?)", args: ["team_default", "Support Team", "Default support team"] });

// ---------- Seed notification templates ----------
const _tpl = [
  ["ticket_created", "Ticket {{ticketNo}} created", "Your ticket \"{{subject}}\" has been created. We'll get back to you soon."],
  ["ticket_assigned", "Ticket {{ticketNo}} assigned", "Your ticket has been assigned to {{agent}}."],
  ["ticket_status", "Ticket {{ticketNo}} updated", "Status changed to {{status}}."],
  ["agent_reply", "New reply on {{ticketNo}}", "{{agent}} replied to your ticket."],
  ["customer_reply", "Customer replied on {{ticketNo}}", "{{customer}} added a reply."],
  ["ticket_resolved", "Ticket {{ticketNo}} resolved", "Your ticket has been resolved. Please rate our support."],
  ["ticket_closed", "Ticket {{ticketNo}} closed", "Your ticket has been closed."],
  ["ticket_reopened", "Ticket {{ticketNo}} reopened", "Your ticket has been reopened."],
  ["sla_approaching", "SLA approaching on {{ticketNo}}", "This ticket is approaching its SLA deadline."],
  ["sla_breached", "SLA breached on {{ticketNo}}", "This ticket has breached its SLA deadline."],
];
await client.batch(_tpl.map(([k, subj, body]) => ({
  sql: "INSERT OR IGNORE INTO NotificationTemplate (id, key, subject, body, channel, active) VALUES (?, ?, ?, ?, 'IN_APP', 1)",
  args: ["tpl_" + k, k, subj, body],
})), "write");
console.log("✓ Notification templates ready");

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
