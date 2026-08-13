export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_EXT = ["png", "jpg", "jpeg", "gif", "webp", "pdf", "txt", "csv", "doc", "docx", "xls", "xlsx", "zip", "log"];
const BLOCKED_EXT = ["exe", "bat", "cmd", "sh", "js", "mjs", "msi", "com", "scr", "jar", "dll", "app", "ps1"];

export function sanitizeFilename(name: string): string {
  const base = (name || "file").replace(/[^\w.\- ]+/g, "_").replace(/\.{2,}/g, ".").trim();
  return base.slice(0, 120) || "file";
}

/** Returns an error string if invalid, or null if OK. */
export function validateAttachment(a: { filename: string; sizeBytes: number }): string | null {
  const name = sanitizeFilename(a.filename);
  const ext = (name.split(".").pop() || "").toLowerCase();
  if (BLOCKED_EXT.includes(ext)) return "This file type is not allowed for security reasons.";
  if (!ALLOWED_EXT.includes(ext)) return "Unsupported file type.";
  if (a.sizeBytes <= 0) return "The file appears to be empty.";
  if (a.sizeBytes > MAX_ATTACHMENT_BYTES) return "File exceeds the 10 MB limit.";
  return null;
}
