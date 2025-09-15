"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import createApi from "@/lib/api";

export type SimpleUser = {
  id: string;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  userPhoto?: string | null;
};

export default function UsersListModal({
  open,
  onOpenChange,
  userIds,
  title,
  token,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userIds?: string[] | null;
  title?: string;
  token?: string | undefined;
}) {
  const [users, setUsers] = useState<SimpleUser[]>([]);
  const [loading, setLoading] = useState(false);
  const fallbackAvatar =
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const ids = (userIds ?? []).filter(Boolean);
        if (ids.length === 0) {
          setUsers([]);
          return;
        }
        const api = createApi(process.env.NEXT_PUBLIC_USER_SERVICE_URL || "");
        if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // fetch users in parallel
        const results = await Promise.all(
          ids.map(async (id) => {
            try {
              const resp = await api.get(`/api/user/${id}`);
              return resp.data as SimpleUser;
            } catch {
              return null;
            }
          })
        );
        if (cancelled) return;
        setUsers(results.filter(Boolean) as SimpleUser[]);
      } catch (e) {
        console.error("UsersListModal load failed", e);
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, userIds, token]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{title ?? "Users"}</DialogTitle>
        </DialogHeader>

        <div className="p-2 space-y-2">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!loading && users.length === 0 && <div className="text-sm text-muted-foreground">No users found.</div>}

          <ul className="space-y-3">
            {users.map((u) => (
              <li key={u.id} className="flex items-center gap-3 p-2 rounded border bg-card">
                <div>
                  {u.userPhoto ? (
                    <img src={u.userPhoto} alt={u.name ?? u.id} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center font-medium">{String(u.name ?? u.firstName ?? u.id).charAt(0).toUpperCase()}</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-medium">{u.name}</div>
                </div>

                <div>
                  <Link href={`/user/${u.id}`}>
                    <Button size="sm">Visit</Button>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}