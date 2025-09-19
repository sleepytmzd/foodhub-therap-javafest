"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getAllHangouts, HangoutResponse } from "@/lib/hangoutService";
import createApi from "@/lib/api";

export default function HangoutsSidebar({
  profileUserId,
  token,
  onOpenAll,
}: {
  profileUserId: string;
  token?: string | undefined;
  onOpenAll: () => void;
}) {
  const [hangouts, setHangouts] = useState<HangoutResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const userApiBase = process.env.NEXT_PUBLIC_USER_SERVICE_URL || "";

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const all = await getAllHangouts(undefined, token);
        // filter hangouts where profileUser is participant
        const mine = (all || []).filter((h) => String(h.userId1) === String(profileUserId) || String(h.userId2) === String(profileUserId));
        // sort by allocatedTime descending fallback to id
        mine.sort((a, b) => {
          const ta = a.allocatedTime ?? "";
          const tb = b.allocatedTime ?? "";
          if (ta && tb) return tb.localeCompare(ta);
          return (b.id ?? "").localeCompare(a.id ?? "");
        });
        if (!cancelled) setHangouts(mine.slice(0, 3));
      } catch (e) {
        console.error("load hangouts failed", e);
        if (!cancelled) setHangouts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [profileUserId, token]);

  return (
    <div className="rounded-md border p-4 bg-card-foreground/5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Recent hangouts</h3>
        <Button size="sm" variant="ghost" onClick={onOpenAll}>See all</Button>
      </div>

      <ul className="mt-3 space-y-3">
        {loading && <li className="text-sm text-muted-foreground">Loading…</li>}
        {!loading && hangouts.length === 0 && <li className="text-sm text-muted-foreground">No hangouts yet.</li>}
        {hangouts.map((h) => {
          const otherId = String(h.userId1) === String(profileUserId) ? h.userId2 : h.userId1;
          return (
            <li key={h.id} className="text-sm">
              <div className="font-medium">{h.message ?? "Hangout request"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {h.allocatedTime ? new Date(h.allocatedTime).toLocaleString() : (h.restaurantId ? "Restaurant invited" : "Pending")}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}