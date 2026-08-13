export const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  NEW: { label: "New", color: "#1d4ed8", bg: "#dbeafe" },
  OPEN: { label: "Open", color: "#4338ca", bg: "#e0e7ff" },
  IN_PROGRESS: { label: "In Progress", color: "#b45309", bg: "#fef3c7" },
  PENDING_CUSTOMER: { label: "Pending Customer", color: "#7e22ce", bg: "#f3e8ff" },
  RESOLVED: { label: "Resolved", color: "#047857", bg: "#d1fae5" },
  CLOSED: { label: "Closed", color: "#475569", bg: "#e2e8f0" },
};
export const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  LOW: { label: "Low", color: "#475569", bg: "#e2e8f0" },
  MEDIUM: { label: "Medium", color: "#1d4ed8", bg: "#dbeafe" },
  HIGH: { label: "High", color: "#b45309", bg: "#fef3c7" },
  CRITICAL: { label: "Critical", color: "#b91c1c", bg: "#fee2e2" },
};
export function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] || { label: status, color: "#475569", bg: "#e2e8f0" };
  return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ color: m.color, background: m.bg }}>{m.label}</span>;
}
export function PriorityBadge({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority] || { label: priority, color: "#475569", bg: "#e2e8f0" };
  return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ color: m.color, background: m.bg }}>{m.label}</span>;
}
export function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
export function agentName(a?: { email?: string; profile?: { firstName?: string; lastName?: string } | null } | null) {
  if (!a) return "Unassigned";
  const n = `${a.profile?.firstName || ""} ${a.profile?.lastName || ""}`.trim();
  return n || a.email || "Agent";
}
