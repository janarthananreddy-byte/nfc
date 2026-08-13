import { prisma } from "@/lib/prisma";

function render(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k] ?? ""));
}

/** Create an in-app notification (and, later, email) from a template key. */
export async function notify(opts: {
  userId: string;
  event: string;
  ticketId?: string | null;
  vars?: Record<string, string>;
}) {
  try {
    if (!opts.userId) return;
    const tpl = await prisma.notificationTemplate.findUnique({ where: { key: opts.event } });
    const vars = opts.vars || {};
    const title = tpl ? render(tpl.subject, vars) : opts.event;
    const body = tpl ? render(tpl.body, vars) : "";
    await prisma.notification.create({
      data: { userId: opts.userId, ticketId: opts.ticketId || undefined, type: opts.event, title, body },
    });
    // EMAIL channel hook: integrate lib/mailer here when template.channel includes EMAIL.
  } catch (e) {
    console.error("notify failed", e);
  }
}
