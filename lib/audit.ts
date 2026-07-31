import { prisma } from "@/lib/prisma";

export async function logAudit(params: {
  actorEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  details?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorEmail: params.actorEmail || "",
        action: params.action,
        targetType: params.targetType || "",
        targetId: params.targetId || "",
        targetLabel: params.targetLabel || "",
        details: params.details || "",
      },
    });
  } catch (e) {
    console.error("audit log failed", e);
  }
}
