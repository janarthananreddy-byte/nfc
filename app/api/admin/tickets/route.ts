import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isStaff } from "@/lib/authz";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !isStaff(session.user.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const status = searchParams.get("status") || "";
  const priority = searchParams.get("priority") || "";
  const categoryId = searchParams.get("category") || "";
  const agentId = searchParams.get("agent") || "";
  const teamId = searchParams.get("team") || "";
  const sort = searchParams.get("sort") || "updatedAt";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = 15;

  const and: Record<string, unknown>[] = [];
  if (status) and.push({ status });
  if (priority) and.push({ priority });
  if (categoryId) and.push({ categoryId });
  if (agentId) and.push({ assignedAgentId: agentId });
  if (teamId) and.push({ assignedTeamId: teamId });
  if (q) and.push({ OR: [
    { ticketNo: { contains: q } }, { subject: { contains: q } }, { description: { contains: q } },
    { requester: { is: { email: { contains: q } } } },
    { requester: { is: { profile: { is: { firstName: { contains: q } } } } } },
    { requester: { is: { profile: { is: { lastName: { contains: q } } } } } },
  ] });
  const where = and.length ? { AND: and } : {};

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where, skip: (page - 1) * limit, take: limit, orderBy: { [sort]: dir },
      include: {
        category: { select: { name: true } },
        assignedAgent: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
        requester: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.ticket.count({ where }),
  ]);
  return NextResponse.json({ tickets, total, page, pages: Math.ceil(total / limit) });
}
