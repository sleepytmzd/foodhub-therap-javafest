"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import createApi from "@/lib/api";
import { getNutritionFromImageUrl } from "@/lib/nutritionService";
import { updateFood, FoodRequest, FoodResponse } from "@/lib/foodService";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { updateUser } from "@/lib/userService";

export default function UserFoodsModal({
  open,
  onOpenChange,
  userId,
  token,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  userId: string;
  token?: string | undefined;
}) {
  const { keycloak } = useAuth();
  const { toast } = useToast();
  const [foods, setFoods] = useState<FoodResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyIds, setBusyIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const api = createApi(process.env.NEXT_PUBLIC_FOOD_SERVICE_URL || "");
        if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const resp = await api.get<FoodResponse[]>("/api/food");
        const all = resp.data || [];
        const mine = all.filter((f) => String(f.user_id) === String(userId));
        if (!cancelled) setFoods(mine);
      } catch (e) {
        console.error("load user foods failed", e);
        if (!cancelled) setFoods([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, userId, token]);

  const handleGenerate = async (f: FoodResponse) => {
    if (!f.image_url) {
      // keep simple UX
      toast({ title: "No image", description: "Nutrition generation requires an image.", variant: "destructive" });
      return;
    }
    setBusyIds((s) => ({ ...s, [f.id]: true }));
    const userServiceBase = process.env.NEXT_PUBLIC_USER_SERVICE_URL || "";
    const tokenLocal = token ?? (keycloak as any)?.token ?? undefined;
    const api = createApi(userServiceBase);
    if (tokenLocal) (api as any).defaults.headers.common["Authorization"] = `Bearer ${tokenLocal}`;

    // fetch latest user to check coins
    let userData: any = null;
    try {
      const resp = await api.get(`/api/user/${userId}`);
      userData = resp.data;
      const coins = (userData?.coins ?? 0);
      if (coins < 1) {
        toast({ title: "Insufficient coins", description: "You need at least 1 coin to generate nutrition.", variant: "destructive" });
        setBusyIds((s) => ({ ...s, [f.id]: false }));
        return;
      }
      // deduct 1 coin up-front
      const updatedPayload = {
        id: userData.id,
        name: userData.name ?? "",
        firstName: userData.firstName ?? "",
        lastName: userData.lastName ?? "",
        email: userData.email ?? "",
        coverPhoto: userData.coverPhoto ?? null,
        userPhoto: userData.userPhoto ?? null,
        location: userData.location ?? null,
        totalCriticScore: userData.totalCriticScore ?? 0,
        coins: coins - 1,
        following: userData.following ?? [],
        followers: userData.followers ?? [],
        visits: userData.visits ?? [],
        criticScoreHistory: userData.criticScoreHistory ?? [],
        locationRecommendations: userData.locationRecommendations ?? [],
      };
      await updateUser(userId, updatedPayload, userServiceBase, tokenLocal);
      toast({ title: "1 coin deducted", description: "Generating nutrition table…" });
    } catch (e) {
      console.error("coin check/deduct failed", e);
      toast({ title: "Error", description: "Could not verify or deduct coins.", variant: "destructive" });
      setBusyIds((s) => ({ ...s, [f.id]: false }));
      return;
    }

    try {
      const nutrition = await getNutritionFromImageUrl(f.image_url, process.env.NEXT_PUBLIC_NUTRITION_AGENT_URL);
      // store nutrition_table as JSON string (backend field is string)
      const updated = { ...f, nutrition_table: JSON.stringify(nutrition) };
      await updateFood(f.id, updated, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token);
      setFoods((arr) => arr.map((it) => (it.id === f.id ? { ...it, nutrition_table: JSON.stringify(nutrition) } : it)));
      toast({ title: "Nutrition generated", description: "Nutrition table saved." });
    } catch (e) {
      console.error("generate nutrition failed", e);
      // attempt refund one coin
      try {
        if (userData) {
          const refundPayload = {
            id: userData.id,
            name: userData.name ?? "",
            firstName: userData.firstName ?? "",
            lastName: userData.lastName ?? "",
            email: userData.email ?? "",
            coverPhoto: userData.coverPhoto ?? null,
            userPhoto: userData.userPhoto ?? null,
            location: userData.location ?? null,
            totalCriticScore: userData.totalCriticScore ?? 0,
            coins: (userData.coins ?? 0),
            following: userData.following ?? [],
            followers: userData.followers ?? [],
            visits: userData.visits ?? [],
            criticScoreHistory: userData.criticScoreHistory ?? [],
            locationRecommendations: userData.locationRecommendations ?? [],
          };
          await updateUser(userId, refundPayload, process.env.NEXT_PUBLIC_USER_SERVICE_URL || "", token ?? (keycloak as any)?.token ?? undefined);
          toast({ title: "Refunded", description: "Coin refunded due to failure." });
        }
      } catch (rerr) {
        console.warn("refund failed", rerr);
      }
      toast({ title: "Failed", description: "Failed to generate nutrition.", variant: "destructive" });
    } finally {
      setBusyIds((s) => ({ ...s, [f.id]: false }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Your foods</DialogTitle>
        </DialogHeader>

        <div className="p-3 space-y-4">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {!loading && foods.length === 0 && <div className="text-sm text-muted-foreground">No foods created yet.</div>}

          <ul className="space-y-3">
            {foods.map((f) => (
              <li key={f.id} className="flex items-start gap-3 p-3 rounded border bg-card">
                {f.image_url ? (
                  <img src={f.image_url} alt={f.f_name} className="w-20 h-20 rounded object-cover border" />
                ) : (
                  <div className="w-20 h-20 rounded bg-muted flex items-center justify-center text-xs">No image</div>
                )}

                <div className="flex-1">
                  <div className="font-medium">{f.f_name}</div>
                  {f.category && <div className="text-xs text-muted-foreground">Category: {f.category}</div>}
                  {f.description && <div className="text-sm text-muted-foreground mt-1">{f.description}</div>}

                  <div className="mt-2 text-xs">
                    <div className="text-muted-foreground">Price: {f.price ?? "—"}</div>
                    <div className="mt-1">
                      <div className="font-medium">Nutrition</div>
                      {f.nutrition_table ? (
                        <div className="mt-1 rounded bg-muted/5 p-2">
                          {(() => {
                            const nutrition =
                              typeof f.nutrition_table === "string"
                                ? JSON.parse(f.nutrition_table)
                                : f.nutrition_table;

                            return (
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="font-medium">Description:</span>{" "}
                                  {nutrition.food_description}
                                </div>
                                <div>
                                  <span className="font-medium">Carbohydrates:</span>{" "}
                                  {nutrition.carbohydrates}
                                </div>
                                <div>
                                  <span className="font-medium">Proteins:</span>{" "}
                                  {nutrition.proteins}
                                </div>
                                <div>
                                  <span className="font-medium">Fats:</span>{" "}
                                  {nutrition.fats}
                                </div>
                                <div>
                                  <span className="font-medium">Total Calories:</span>{" "}
                                  {nutrition.total_calories}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground mt-1">
                          No nutrition table
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div className="flex flex-col gap-2">
                  {!f.nutrition_table && (
                    <Button size="sm" onClick={() => handleGenerate(f)} disabled={!!busyIds[f.id]}>
                      {busyIds[f.id] ? "Generating…" : "Generate nutrition table"}
                    </Button>
                  )}
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