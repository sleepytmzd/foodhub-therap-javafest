"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FoodResponse, getFoodById } from "@/lib/foodService";
import { getRestaurantById } from "@/lib/restaurantService";

export default function FoodDetailsModal({
  open,
  onOpenChange,
  food,
  token,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  food: FoodResponse | null;
  token?: string | undefined;
}) {
  const [loading, setLoading] = useState(false);
  const [resolvedFood, setResolvedFood] = useState<FoodResponse | null>(null);
  const [restaurant, setRestaurant] = useState<{ name?: string; location?: string; category?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !food) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setResolvedFood(null);
      setRestaurant(null);
      try {
        // if food has id, fetch latest
        if (food.id) {
          const f = await getFoodById(food.id, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token);
          if (!cancelled) setResolvedFood(f);
          if (f?.resturant_id) {
            try {
              const r = await getRestaurantById(f.resturant_id, process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL, token);
              if (!cancelled) setRestaurant({ name: r.name, location: r.location ?? undefined, category: r.category ?? undefined });
            } catch {
              // ignore restaurant fetch failure
            }
          }
        } else {
          setResolvedFood(food);
          if (food.resturant_id) {
            try {
              const r = await getRestaurantById(food.resturant_id, process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL, token);
              if (!cancelled) setRestaurant({ name: r.name, location: r.location ?? undefined, category: r.category ?? undefined });
            } catch {
              // ignore
            }
          }
        }
      } catch (e) {
        console.error("FoodDetailsModal load failed", e);
        if (!cancelled) setError("Failed to load food details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, food, token]);

  const f = resolvedFood ?? food;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{f?.f_name ?? "Food details"}</DialogTitle>
        </DialogHeader>

        <div className="p-3 space-y-3">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}

          {!loading && f && (
            <>
              <div className="flex gap-4 items-start">
                <div className="w-28 h-28 rounded overflow-hidden flex-shrink-0">
                  {f.image_url ? (
                    // keep small pic
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.image_url} alt={f.f_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs">No image</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-medium text-lg">{f.f_name}</div>
                  {f.category && <div className="text-sm text-muted-foreground">Category: {f.category}</div>}
                  {f.price != null && <div className="text-sm text-muted-foreground mt-1">Price: {f.price}</div>}
                  {f.description && <div className="text-sm text-muted-foreground mt-2">{f.description}</div>}
                </div>
              </div>

              <div>
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

              <div>
                <div className="font-medium mt-2">Restaurant</div>
                {restaurant ? (
                  <div className="p-2 rounded border mt-2" style={{ backgroundColor: "var(--card)", color: "var(--card-foreground)" }}>
                    <div className="font-medium">{restaurant.name}</div>
                    {restaurant.location && <div className="text-xs text-muted-foreground">{restaurant.location}</div>}
                    {restaurant.category && <div className="text-xs text-muted-foreground mt-1">Category: {restaurant.category}</div>}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground mt-1">No restaurant information</div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}