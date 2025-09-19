"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAllHangouts, HangoutResponse, updateHangout } from "@/lib/hangoutService";
import createApi from "@/lib/api";
import { getRestaurantById } from "@/lib/restaurantService";
import { getFoodById } from "@/lib/foodService";
import { useAuth } from "@/providers/AuthProvider";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";

export default function HangoutsModal({
  open,
  onOpenChange,
  profileUserId,
  token,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profileUserId: string;
  token?: string | undefined;
}) {
  const { keycloak } = useAuth();
  const { toast } = useToast();
  const currentUserId = (keycloak as any)?.tokenParsed?.sub ?? null;
  const authToken = token ?? (keycloak as any)?.token ?? undefined;

  const [hangouts, setHangouts] = useState<HangoutResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState<Record<string, { user1Name?: string; user2Name?: string; restaurantName?: string; foodNames?: string[] }>>({});
  const userBase = process.env.NEXT_PUBLIC_USER_SERVICE_URL || "";

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const all = await getAllHangouts(undefined, authToken);
        const mine = (all || []).filter((h) => String(h.userId1) === String(profileUserId) || String(h.userId2) === String(profileUserId));
        // sort newest first by allocatedTime if present, else by id
        mine.sort((a, b) => {
          const ta = a.allocatedTime ?? "";
          const tb = b.allocatedTime ?? "";
          if (ta && tb) return tb.localeCompare(ta);
          return (b.id ?? "").localeCompare(a.id ?? "");
        });
        if (cancelled) return;
        setHangouts(mine);

        // resolve names & restaurant/foods
        const map: Record<string, any> = {};
        await Promise.all(
          mine.map(async (h) => {
            const entry: any = {};
            try {
              const api = createApi(userBase);
              if (authToken) (api as any).defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
              if (h.userId1) {
                try {
                  const r = await api.get(`/api/user/${h.userId1}`);
                  entry.user1Name = r.data?.name ?? h.userId1;
                } catch {
                  entry.user1Name = h.userId1;
                }
              }
              if (h.userId2) {
                try {
                  const r = await api.get(`/api/user/${h.userId2}`);
                  entry.user2Name = r.data?.name ?? h.userId2;
                } catch {
                  entry.user2Name = h.userId2;
                }
              }
              if (h.restaurantId) {
                try {
                  const rest = await getRestaurantById(h.restaurantId, process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL, authToken);
                  entry.restaurantName = rest?.name ?? undefined;
                } catch {
                  entry.restaurantName = undefined;
                }
              }
              if (h.foodIds && h.foodIds.length) {
                const names: string[] = [];
                await Promise.all(
                  h.foodIds.map(async (fid) => {
                    try {
                      const f = await getFoodById(fid, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, authToken);
                      names.push(f.f_name ?? fid);
                    } catch {
                      names.push(fid);
                    }
                  })
                );
                entry.foodNames = names;
              }
            } catch (e) {
              // continue
            } finally {
              map[h.id] = entry;
            }
          })
        );
        if (!cancelled) setResolved(map);
      } catch (e) {
        console.error("load hangouts failed", e);
        setHangouts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, profileUserId, authToken, userBase]);

  const computeStatus = (h: HangoutResponse) => {
    if (h.approvedByUser1 === true && h.approvedByUser2 === true) return "accepted";
    if (h.approvedByUser1 === false || h.approvedByUser2 === false) return "declined";
    return "pending";
  };

  const onRespond = async (h: HangoutResponse, accept: boolean) => {
    try {
      if (!currentUserId) {
        toast({ title: "Authentication required", description: "Sign in to respond to hangouts.", variant: "destructive" });
        return;
      }

      // build payload preserving other fields
      const payload: any = {
        message: h.message ?? null,
        userId1: h.userId1 ?? null,
        userId2: h.userId2 ?? null,
        restaurantId: h.restaurantId ?? null,
        approvedByUser1: h.approvedByUser1 ?? null,
        approvedByUser2: h.approvedByUser2 ?? null,
        allocatedTime: h.allocatedTime ?? null,
        foodIds: h.foodIds ?? [],
      };

      if (String(currentUserId) === String(h.userId1)) {
        payload.approvedByUser1 = accept;
      } else if (String(currentUserId) === String(h.userId2)) {
        payload.approvedByUser2 = accept;
      } else {
        toast({ title: "Not a participant", description: "You are not a participant of this hangout.", variant: "destructive" });
        return;
      }

      await updateHangout(h.id, payload, undefined, authToken);
      // refresh list
      const all = await getAllHangouts(undefined, authToken);
      const mine = (all || []).filter((r) => String(r.userId1) === String(profileUserId) || String(r.userId2) === String(profileUserId));
      mine.sort((a, b) => {
        const ta = a.allocatedTime ?? "";
        const tb = b.allocatedTime ?? "";
        if (ta && tb) return tb.localeCompare(ta);
        return (b.id ?? "").localeCompare(a.id ?? "");
      });
      setHangouts(mine);

      // refresh resolved map for updated hangout
      const newResolved: Record<string, any> = { ...resolved };
      if (newResolved[h.id]) {
        newResolved[h.id] = { ...newResolved[h.id] };
      }
      setResolved(newResolved);

      toast({ title: accept ? "Accepted" : "Declined", description: `Hangout ${accept ? "accepted" : "declined"}.` });
    } catch (e) {
      console.error("respond failed", e);
      toast({ title: "Error", description: "Failed to respond to hangout.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Hangouts</DialogTitle>
        </DialogHeader>

        <div className="p-3 space-y-4">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!loading && hangouts.length === 0 && <div className="text-sm text-muted-foreground">No hangouts found.</div>}

          <ul className="space-y-3">
            {hangouts.map((h) => {
              const info = resolved[h.id] ?? {};
              const requesterName = info.user1Name ?? h.userId1;
              const recipientName = info.user2Name ?? h.userId2;
              const direction = String(h.userId1) === String(currentUserId) ? "sent" : String(h.userId2) === String(currentUserId) ? "received" : "other";
              const status = computeStatus(h);

              // determine if the current user can respond (is recipient and their approved flag is not yet true/false)
              const canRespond =
                String(currentUserId) === String(h.userId2) &&
                (h.approvedByUser2 === null || h.approvedByUser2 === undefined);

              // human readable time
              const timeLabel = h.allocatedTime ? `${new Date(h.allocatedTime).toLocaleString()} (${formatDistanceToNow(new Date(h.allocatedTime), { addSuffix: true })})` : "No time set";

              // status badge classes (adapt to light/dark)
              const statusClasses =
                status === "accepted"
                  ? "text-green-700 bg-green-50 dark:text-green-200 dark:bg-green-900/30 px-2 py-1 rounded text-xs"
                  : status === "declined"
                  ? "text-red-700 bg-red-50 dark:text-red-200 dark:bg-red-900/30 px-2 py-1 rounded text-xs"
                  : "text-amber-800 bg-amber-50 dark:text-amber-200 dark:bg-amber-900/30 px-2 py-1 rounded text-xs";

              return (
                <li key={h.id} className="rounded border p-3 bg-card hover:scale-101 transition-transform hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{h.message ?? "Hangout request"}</div>
                        <div className={statusClasses}>{status.toUpperCase()}</div>
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">
                        Sent by: <span className="font-medium">{requesterName}</span>
                        {" · "}Recipient: <span className="font-medium">{recipientName}</span>
                      </div>

                      <div className="text-xs text-muted-foreground mt-1">Direction: <span className="font-medium">{direction}</span></div>

                      {h.restaurantId && (
                        <div className="text-xs text-muted-foreground mt-1">At: <span className="font-medium">{info.restaurantName ?? "Restaurant"}</span></div>
                      )}

                      {info.foodNames && info.foodNames.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">Foods: {info.foodNames.join(", ")}</div>
                      )}

                      <div className="text-xs text-muted-foreground mt-1">Time: {timeLabel}</div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {canRespond ? (
                        <>
                          <Button size="sm" onClick={() => onRespond(h, true)}>Accept</Button>
                          <Button size="sm" variant="destructive" onClick={() => onRespond(h, false)}>Decline</Button>
                        </>
                      ) : (
                        <>
                          {String(currentUserId) === String(h.userId1) && (
                            <div className="text-sm text-muted-foreground">
                              You: {h.approvedByUser1 === true ? "Accepted" : h.approvedByUser1 === false ? "Declined" : "Pending"}
                            </div>
                          )}
                          {String(currentUserId) === String(h.userId2) && (
                            <div className="text-sm text-muted-foreground">
                              You: {h.approvedByUser2 === true ? "Accepted" : h.approvedByUser2 === false ? "Declined" : "Pending"}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-3 flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}