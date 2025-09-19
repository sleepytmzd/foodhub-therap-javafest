"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { fetchUsers, UserSummary } from "@/lib/userService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UsersGrid() {
  const { initialized, keycloak } = useAuth();
  const token = (keycloak as any)?.token ?? undefined;
  const myUserId = (keycloak as any)?.tokenParsed?.sub ?? undefined;

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchUsers(
          process.env.NEXT_PUBLIC_USER_SERVICE_URL,
          token
        );
        if (!cancelled) {
          // filter out myself
          setUsers(myUserId ? data.filter((u) => u.id !== myUserId) : data);
        }
      } catch (e) {
        console.error("UsersGrid: failed to load users", e);
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (initialized) load();
    return () => {
      cancelled = true;
    };
  }, [initialized, token, myUserId]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) =>
        (u.name ?? "").toLowerCase().includes(s) ||
        (u.firstName ?? "").toLowerCase().includes(s) ||
        (u.lastName ?? "").toLowerCase().includes(s) ||
        (u.email ?? "").toLowerCase().includes(s)
    );
  }, [users, q]);

  return (
    <section className="space-y-4">
      <div className="rounded-md border p-4 bg-card-foreground/5 flex items-center gap-4">
        <div className="flex-1">
          <h3 className="font-semibold">Users</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Discover reviewers and contributors.
          </p>
        </div>
        <div className="w-64">
          <Input
            placeholder="Search users..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {loading && (
          <div className="text-sm text-muted-foreground">Loading users…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-sm text-muted-foreground">No users found.</div>
        )}

        {filtered.map((u) => (
          <div
            key={u.id}
            className="rounded-md border p-3 flex items-center gap-3 bg-card hover:scale-101 transition-transform hover:shadow-md"
          >
            <div>
              {u.userPhoto ? (
                <img
                  src={u.userPhoto}
                  alt={u.name ?? u.id}
                  className="w-12 h-12 rounded-full object-cover "
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                  {String(u.name ?? u.firstName ?? u.id)
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="font-medium">{u.name.trim() || u.id}</div>
              <div className="text-sm text-muted-foreground">
                {u.firstName ?? "—"} {u.lastName ?? ""}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Link href={`/user/${u.id}`}>
                <Button size="sm">View</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
