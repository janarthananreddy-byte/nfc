/**
 * First-time setup script.
 * Run: node setup.mjs
 * Creates the SQLite database, applies the schema, and seeds the admin user.
 */

import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

console.log("NFC Emergency ID — Setup\n");

const db = new DatabaseSync("dev.db");

// Apply schema
const sql = readFileSync("prisma/migrations/20260626125749_init/migration.sql", "utf-8");
try {
  db.exec(sql);
  console.log("✓ Database schema created");
} catch {
  console.log("✓ Database schema already exists");
}

// Seed admin user
const existing = db.prepare("SELECT id FROM User WHERE email = ?").get("admin@nfctag.com");
if (!existing) {
  const hash = await bcrypt.hash("Admin@123", 12);
  const userId = "admin001";
  const now = new Date().toISOString();
  db.prepare("INSERT OR IGNORE INTO User (id, email, password, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)").run(userId, "admin@nfctag.com", hash, "admin", now, now);
  db.prepare("INSERT OR IGNORE INTO Profile (id, userId, firstName, lastName, cyclingType, updatedAt) VALUES (?, ?, ?, ?, ?, ?)").run("profile001", userId, "Admin", "User", "Admin", now);
  db.prepare("INSERT OR IGNORE INTO NfcTag (id, userId, tagSlug, isActive, createdAt) VALUES (?, ?, ?, ?, ?)").run("tag001", userId, "admin-demo-tag-001", 1, now);
  console.log("✓ Admin user created");
  console.log("  Email:    admin@nfctag.com");
  console.log("  Password: Admin@123");
} else {
  console.log("✓ Admin user already exists");
}

db.close();
console.log("\nSetup complete! Run: npm run dev\n");
