export const SLA_HOURS: Record<string, number> = { LOW: 72, MEDIUM: 48, HIGH: 24, CRITICAL: 4 };

export function slaDueDate(priority: string, from: Date = new Date()): Date {
  const h = SLA_HOURS[priority] ?? 48;
  return new Date(from.getTime() + h * 3600 * 1000);
}

export function slaState(dueAt: Date | null, closed: boolean): "none" | "ok" | "approaching" | "breached" {
  if (!dueAt || closed) return "none";
  const now = Date.now();
  const due = new Date(dueAt).getTime();
  if (now > due) return "breached";
  if (due - now < 2 * 3600 * 1000) return "approaching";
  return "ok";
}
