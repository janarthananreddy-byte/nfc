"use client";
import { useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  profile: { firstName: string; lastName: string; bloodType: string } | null;
  nfcTag: { tagSlug: string; isActive: boolean; _count: { taps: number } } | null;
  shippingAddresses: { city: string; country: string }[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  function load(p: number) {
    setLoading(true);
    fetch(`/api/admin/users?page=${p}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users);
        setTotal(d.total);
        setPages(d.pages);
        setLoading(false);
      });
  }

  useEffect(() => { load(page); }, [page]);

  async function toggleTag(userId: string) {
    setActionLoading(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "toggleTag" }),
    });
    if (res.ok) load(page);
    setActionLoading(null);
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? This cannot be undone.`)) return;
    setActionLoading(userId);
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "deleteUser" }),
    });
    load(page);
    setActionLoading(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-nfc-dark tracking-tight">Users</h1>
          <p className="text-nfc-muted text-sm mt-1">{total} registered accounts</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-nfc-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-nfc-border">
                <th className="text-left px-4 py-3 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>User</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Blood</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Taps</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Tag</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Joined</th>
                <th className="text-right px-4 py-3 text-xs font-bold text-nfc-muted uppercase tracking-widest" style={{ fontFamily: "Space Mono, monospace" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-nfc-muted text-sm">Loading…</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-nfc-muted text-sm">No users found</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-nfc-border/50 hover:bg-nfc-bg/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-nfc-red-light flex items-center justify-center text-nfc-red font-bold text-sm">
                          {(u.profile?.firstName || u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-nfc-dark text-sm">
                            {u.profile?.firstName && u.profile?.lastName ? `${u.profile.firstName} ${u.profile.lastName}` : "—"}
                          </p>
                          <p className="text-xs text-nfc-muted">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {u.profile?.bloodType ? (
                        <span className="px-2 py-1 bg-nfc-red text-white text-xs font-bold rounded-md" style={{ fontFamily: "Space Mono, monospace" }}>
                          {u.profile.bloodType}
                        </span>
                      ) : <span className="text-nfc-subtle text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-nfc-dark text-sm">{u.nfcTag?._count?.taps ?? 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      {u.nfcTag ? (
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${u.nfcTag.isActive ? "bg-green-100 text-green-700" : "bg-nfc-border text-nfc-muted"}`}>
                          {u.nfcTag.isActive ? "ACTIVE" : "DISABLED"}
                        </span>
                      ) : <span className="text-nfc-subtle text-xs">No tag</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-nfc-muted">
                      {new Date(u.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.nfcTag && (
                          <button
                            onClick={() => toggleTag(u.id)}
                            disabled={actionLoading === u.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                              u.nfcTag.isActive ? "bg-nfc-border text-nfc-dark hover:bg-nfc-muted/20" : "bg-green-100 text-green-700 hover:bg-green-200"
                            }`}
                          >
                            {u.nfcTag.isActive ? "Disable Tag" : "Enable Tag"}
                          </button>
                        )}
                        {u.role !== "admin" && (
                          <button
                            onClick={() => deleteUser(u.id, u.email)}
                            disabled={actionLoading === u.id}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-nfc-red-light text-nfc-red hover:bg-nfc-red hover:text-white transition-colors disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                        {u.nfcTag && (
                          <a
                            href={`/tag/${u.nfcTag.tagSlug}`}
                            target="_blank"
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-nfc-dark text-white hover:bg-nfc-dark/80 transition-colors"
                          >
                            View Card
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-nfc-border">
            <p className="text-xs text-nfc-muted">Page {page} of {pages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-nfc-outer text-nfc-dark disabled:opacity-40 hover:bg-nfc-border transition-colors">
                ← Prev
              </button>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-nfc-outer text-nfc-dark disabled:opacity-40 hover:bg-nfc-border transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
