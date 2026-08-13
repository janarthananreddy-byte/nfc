const ARTICLES = [
  { q: "How do I create a support ticket?", a: "Go to Create Ticket, fill in the subject, description, category and priority, attach any files, and submit. You'll get a unique ticket number (TKT-YYYY-000001) to track it." },
  { q: "What do the priorities mean?", a: "Low: minor issue, no urgency. Medium: normal issue. High: significant impact. Critical: system down or blocking — we respond fastest to these." },
  { q: "How do I track my ticket?", a: "Open My Tickets to see status, assigned agent and last update. Click any ticket to view the full conversation and reply." },
  { q: "What are the ticket statuses?", a: "New → Open → In Progress → Pending Customer → Resolved → Closed. 'Pending Customer' means we're waiting on your reply." },
  { q: "Can I reopen a resolved ticket?", a: "Yes — open the ticket and choose Request Reopen. It moves back to Open and your agent is notified." },
  { q: "How do I rate the support?", a: "Once a ticket is resolved or closed, a 1–5 star rating appears on the ticket page. Your feedback helps us improve." },
];

export default function KnowledgeBasePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-extrabold text-nfc-dark mb-1">Knowledge Base</h1>
      <p className="text-nfc-muted text-sm mb-6">Answers to the most common questions.</p>
      <div className="space-y-3">
        {ARTICLES.map((a) => (
          <details key={a.q} className="bg-white rounded-2xl border border-nfc-border p-5 group">
            <summary className="font-bold text-nfc-dark cursor-pointer list-none flex items-center justify-between">{a.q}<span className="text-nfc-red group-open:rotate-45 transition-transform">+</span></summary>
            <p className="text-sm text-nfc-muted mt-3 leading-relaxed">{a.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
