"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/AuthProvider";
import { getVisitById, getVisitByRestaurantId } from "@/lib/visitService";
import { getFoodById } from "@/lib/foodService";
import type { FoodResponse } from "@/lib/foodService";
import { format } from "date-fns";
import createApi from "@/lib/api";

export default function RestaurantDetails({
  restaurantId,
  open,
  onClose,
}: {
  restaurantId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { initialized, keycloak } = useAuth();
  const token = (keycloak as any)?.token ?? undefined;

  const [loading, setLoading] = useState(false);
  const [visit, setVisit] = useState<any | null>(null);
  const [foods, setFoods] = useState<FoodResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<any[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const v = await getVisitByRestaurantId(restaurantId, process.env.NEXT_PUBLIC_VISIT_SERVICE_URL, token);
        if (cancelled) return;
        setVisit(v);
        const foodIds: string[] = v.foods ?? [];
        const fetched: FoodResponse[] = [];
        await Promise.all(
          (foodIds || []).map(async (fid) => {
            try {
              const f = await getFoodById(fid, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token);
              if (!cancelled) fetched.push(f);
            } catch (e) {
              // ignore missing food
            }
          })
        );
        if (!cancelled) setFoods(fetched);
        // fetch reviews for this restaurant (fallback to fetching all and filtering)
        try {
          const reviewApi = createApi(process.env.NEXT_PUBLIC_REVIEW_SERVICE_URL || "");
          if (keycloak?.token) (reviewApi as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
          const rResp = await reviewApi.get("/api/review");
          const all = rResp.data || [];
          console.log("all fetched reviews", all);
          
          const related = (all as any[]).filter((r) => String(r.resturantId) === String(restaurantId));
          setReviews(related);
          // fetch user names for reviewers
          const userApi = createApi(process.env.NEXT_PUBLIC_USER_SERVICE_URL || "");
          if (keycloak?.token) (userApi as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
          const uids = Array.from(new Set(related.map((r) => r.userId).filter(Boolean)));
          const namesMap: Record<string, string> = {};
          await Promise.all(
            uids.map(async (uid) => {
              try {
                const u = await userApi.get(`/api/user/${uid}`);
                namesMap[uid] = u.data?.name ?? uid;
              } catch {
                namesMap[uid] = uid;
              }
            })
          );
          if (!cancelled) setUserNames(namesMap);
        } catch (e) {
          console.warn("failed to fetch reviews for restaurant", e);
        }
      } catch (e) {
        console.error("failed loading restaurant details", e);
        if (!cancelled) setError("Failed to load details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, restaurantId, token, initialized, keycloak]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Restaurant details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}

          {!loading && visit && (
            <div className="rounded border p-4 bg-card space-y-3">
              <div>
                <div className="text-lg font-medium">{visit.resturantName ?? "Unknown"}</div>
                <div className="text-sm text-muted-foreground">
                  {visit.location ?? "Unknown location"} ·{" "}
                  {visit.time ? format(new Date(visit.time), "PPpp") : "Unknown time"}
                </div>
                {visit.userId && <div className="text-xs text-muted-foreground mt-1">Created by: {visit.userId}</div>}
                <div className="text-xs text-muted-foreground mt-1">Visit id: {visit.id}</div>
              </div>

              <div>
                <div className="font-medium mb-2">Foods</div>
                {foods.length === 0 && <div className="text-sm text-muted-foreground">No foods linked to this restaurant.</div>}
                <ul className="space-y-3">
                  {foods.map((f) => (
                    <li key={f.id} className="flex items-center gap-3">
                      {f.image_url ? (
                        <img src={f.image_url} alt={f.f_name} className="w-16 h-16 rounded object-cover border" />
                      ) : (
                        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-xs">No image</div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{f.f_name}</div>
                        {f.description && <div className="text-sm text-muted-foreground">{f.description}</div>}
                        <div className="text-xs text-muted-foreground mt-1">id: {f.id}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-medium mt-4 mb-2">Reviews for this restaurant</div>
                {reviews.length === 0 && <div className="text-sm text-muted-foreground">No reviews found for this restaurant.</div>}
                <ul className="space-y-3">
                  {reviews.map((r) => (
                    <li key={r.id} className="rounded border p-3 bg-card">
                      <div className="font-medium">{r.title ?? "(no title)"}</div>
                      <div className="text-xs text-muted-foreground mt-1">{r.description}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        By: {userNames[r.userId] ?? r.userId} · {r.createdAt ? format(new Date(r.createdAt), "PPpp") : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => onClose()}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}