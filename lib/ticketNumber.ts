import { prisma } from "@/lib/prisma";

/** Generates a unique sequential ticket number: TKT-YYYY-000001 */
export async function nextTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const id = String(year);
  const c = await prisma.counter.upsert({
    where: { id },
    update: { seq: { increment: 1 } },
    create: { id, seq: 1 },
  });
  return `TKT-${year}-${String(c.seq).padStart(6, "0")}`;
}
