"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { deleteVisit, getVisitById, VisitResponse } from "@/lib/visitService";
import { getFoodById, FoodResponse } from "@/lib/foodService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AllVisitsModal({
  open,
  onOpenChange,
  visits,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  visits: { id: string; restaurantName: string; time: string; location?: string | null }[];
}) {
  const { initialized, keycloak } = useAuth();
  const token = (keycloak as any)?.token ?? undefined;
  const isAuth = !!(initialized && keycloak && (keycloak as any).authenticated);

  // detailed visits state
  const [detailed, setDetailed] = useState<
    {
      visit: VisitResponse;
      foods: FoodResponse[];
    }[]
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const results: { visit: VisitResponse; foods: FoodResponse[] }[] = [];
        // fetch full visit for each id and then its foods
        await Promise.all(
          visits.map(async (v) => {
            try {
              const visitFull = await getVisitById(v.id, process.env.NEXT_PUBLIC_VISIT_SERVICE_URL, token);
              const foodIds = visitFull.foods ?? [];
              const foods: FoodResponse[] = [];
              await Promise.all(
                (foodIds || []).map(async (fid) => {
                  try {
                    const f = await getFoodById(fid, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token);
                    foods.push(f);
                  } catch (e) {
                    // ignore missing food
                  }
                })
              );
              results.push({ visit: visitFull, foods });
            } catch (e) {
              // fallback to partial info if get by id fails
              results.push({
                visit: {
                  id: v.id,
                  resturantName: v.restaurantName,
                  location: v.location ?? null,
                  time: v.time ?? null,
                  foods: null,
                  userId: null,
                },
                foods: [],
              });
            }
          })
        );
        if (!cancelled) setDetailed(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, visits, initialized, token]);

  const handleDeleteVisit = async (id: string) => {
    if (!confirm("Delete this visit?")) return;
    try {
      await deleteVisit(id, process.env.NEXT_PUBLIC_VISIT_SERVICE_URL, token);
      setDetailed((s) => s.filter((d) => d.visit.id !== id));
    } catch (e) {
      console.error("delete visit failed", e);
      alert("Failed to delete visit");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>All visits</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {loading && <div className="text-sm text-muted-foreground">Loading visit details…</div>}
          {!loading && detailed.length === 0 && <div className="text-sm text-muted-foreground">No visits recorded.</div>}

          {detailed.map(({ visit, foods }) => (
            <div key={visit.id} className="rounded border p-4 bg-card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-lg font-medium">{visit.resturantName ?? "Unknown restaurant"}</div>
                  <div className="text-sm text-muted-foreground">
                    {visit.location ?? "Unknown location"} · {visit.time ?? "Unknown time"}
                  </div>
                  {visit.userId && <div className="text-xs text-muted-foreground mt-1">User: {visit.userId}</div>}
                  <div className="text-xs text-muted-foreground mt-1">Visit id: {visit.id}</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">{foods.length} food{foods.length !== 1 ? "s" : ""}</div>
                  {isAuth && (
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteVisit(visit.id)}>
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <div className="font-medium mb-2">Foods</div>
                {foods.length === 0 && <div className="text-sm text-muted-foreground">No foods attached to this visit.</div>}
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
                        <div className="text-xs text-muted-foreground mt-1">Food id: {f.id}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}