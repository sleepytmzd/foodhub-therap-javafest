"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { fetchRestaurants as fetchRestaurantsApi, getRestaurantById, RestaurantDto } from "@/lib/restaurantService";
import { getFoodById } from "@/lib/foodService";
import type { FoodResponse } from "@/lib/foodService";
import { FoodCardSmall } from "./AIResultCard";

export default function AIEntityModal({
  open,
  onOpenChange,
  entity,
  type,
  token,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entity: any | null; // item from AI result
  type: "food" | "restaurant" | null;
  token?: string | undefined;
}) {
  const [loading, setLoading] = useState(false);
  const [restaurant, setRestaurant] = useState<RestaurantDto | null>(null);
  const [restaurantFoods, setRestaurantFoods] = useState<FoodResponse[]>([]); // fetched foods for restaurant
  const [food, setFood] = useState<FoodResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !entity || !type) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setRestaurant(null);
      setRestaurantFoods([]);
      setFood(null);
      try {
        if (type === "restaurant") {
          // try db_id first
          if (entity.db_id) {
            const r = await getRestaurantById(entity.db_id, process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL, token);
            if (!cancelled) setRestaurant(r);
            // fetch foods by id list if provided
            if (!cancelled && r?.foodIdList && r.foodIdList.length > 0) {
              const foodPromises = (r.foodIdList || []).map(async (fid: any) => {
                try {
                  // if item is an object already, return it
                  if (typeof fid === "object" && (fid.f_name || fid.name)) return fid as FoodResponse;
                  const id = String(fid);
                  const f = await getFoodById(id, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token);
                  return f;
                } catch {
                  return null;
                }
              });
              const foodsResolved = (await Promise.all(foodPromises)).filter(Boolean) as FoodResponse[];
              if (!cancelled) setRestaurantFoods(foodsResolved);
            }
            return;
          }
          // otherwise fetch all and match by name+location (best-effort)
          const all = await fetchRestaurantsApi(process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL || "", token);
          const found = all.find((a) => String(a.name).toLowerCase() === String(entity.name).toLowerCase() || (entity.location && String(a.location).toLowerCase() === String(entity.location).toLowerCase()));
          if (found && !cancelled) {
            setRestaurant(found);
            if (!cancelled && found?.foodIdList && found.foodIdList.length > 0) {
              const foodPromises = (found.foodIdList || []).map(async (fid: any) => {
                try {
                  if (typeof fid === "object" && (fid.f_name || fid.name)) return fid as FoodResponse;
                  const id = String(fid);
                  const f = await getFoodById(id, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token);
                  return f;
                } catch {
                  return null;
                }
              });
              const foodsResolved = (await Promise.all(foodPromises)).filter(Boolean) as FoodResponse[];
              if (!cancelled) setRestaurantFoods(foodsResolved);
            }
          }
        } else if (type === "food") {
          if (entity.db_id) {
            const f = await getFoodById(entity.db_id, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token);
            if (!cancelled) setFood(f);
            return;
          }
          // try to find food by name (best-effort)
          try {
            const api = (await import("@/lib/api")).default;
            const client = api(process.env.NEXT_PUBLIC_FOOD_SERVICE_URL || "");
            if (token) (client as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
            const resp = await client.get("/api/food");
            const allFoods: any[] = resp.data || [];
            const found = allFoods.find((ff) => String(ff.f_name).toLowerCase() === String(entity.name).toLowerCase());
            if (found && !cancelled) setFood(found);
          } catch {
            // ignore
          }
        }
      } catch (e) {
        console.error("AIEntityModal load failed", e);
        if (!cancelled) setError("Failed to load details from backend");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, entity, type, token]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{type === "food" ? entity?.name ?? "Food" : entity?.name ?? "Restaurant"}</DialogTitle>
        </DialogHeader>

        <div className="p-3 space-y-3">
          {loading && <div className="text-sm text-muted-foreground">Loading…</div>}
          {error && <div className="text-sm text-destructive">{error}</div>}

          {!loading && type === "restaurant" && (
            <>
              <div className="font-medium text-lg">{restaurant?.name ?? entity?.name}</div>
              <div className="text-sm text-muted-foreground">{restaurant?.location ?? entity?.location ?? "Unknown location"}</div>
              {restaurant?.category || entity?.category ? <div className="text-sm text-muted-foreground mt-1">Category: {restaurant?.category ?? entity?.category}</div> : null}
              <div className="mt-2 text-sm text-muted-foreground">{restaurant?.description ?? "No description available"}</div>
              {restaurant?.weblink && (
                <div className="mt-3">
                  <a className="inline-flex items-center px-3 py-1 rounded border hover:bg-muted" href={restaurant.weblink} target="_blank" rel="noreferrer">Visit website</a>
                </div>
              )}

              {/* show foods in this restaurant if available (resolve IDs -> full food info) */}
              {restaurantFoods && restaurantFoods.length > 0 ? (
                <div className="mt-4">
                  <div className="font-medium mb-2">Foods at this restaurant</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {restaurantFoods.map((ff) => (
                      <div key={ff.id ??  ff.f_name} className="p-2 border rounded bg-muted/5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                            {ff.image_url ? <img src={ff.image_url} alt={ff.f_name } className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted flex items-center justify-center text-xs">No image</div>}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{ff.f_name}</div>
                            {ff.category && <div className="text-xs text-muted-foreground">{ff.category}</div>}
                            {typeof ff.price === "number" && <div className="text-xs text-muted-foreground mt-1">Price: {ff.price}</div>}
                          </div>
                        </div>
                      </div> 
                    ))}
                  </div>
                </div>
              ) : (
                // fallback: if restaurant.foodIdList already contains embedded objects, show those
                restaurant?.foodIdList && restaurant.foodIdList.length > 0 && (
                  <div className="mt-4">
                    <div className="font-medium mb-2">Foods at this restaurant</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {restaurant.foodIdList.map((ff: any, i: number) => (
                        <div key={i} className="p-2 border rounded bg-muted/5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                              {ff.image_url ? <img src={ff.image_url} alt={ff.f_name ?? ff.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted flex items-center justify-center text-xs">No image</div>}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{ff.f_name ?? ff.name ?? "Food"}</div>
                              {ff.category && <div className="text-xs text-muted-foreground">{ff.category}</div>}
                              {typeof ff.price === "number" && <div className="text-xs text-muted-foreground mt-1">Price: {ff.price}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </>
          )}

          {!loading && type === "food" && (
            <>
              <div className="flex items-start gap-4">
                <div className="w-28 h-28 rounded overflow-hidden">
                  {food?.image_url ? <img src={food.image_url} alt={food.f_name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-muted flex items-center justify-center text-xs">No image</div>}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-lg">{food?.f_name ?? entity?.name}</div>
                  {food?.category && <div className="text-sm text-muted-foreground">Category: {food?.category}</div>}
                  {food?.price != null && <div className="text-sm text-muted-foreground mt-1">Price: {food.price}</div>}
                  {food?.description && <div className="text-sm text-muted-foreground mt-2">{food.description}</div>}
                </div>
              </div>

              <div className="mt-3">
                <div className="font-medium">Nutrition</div>
                {food?.nutrition_table ? <pre className="text-xs mt-1 whitespace-pre-wrap bg-muted/5 p-2 rounded">{typeof food.nutrition_table === "string" ? food.nutrition_table : JSON.stringify(food.nutrition_table, null, 2)}</pre> : <div className="text-sm text-muted-foreground mt-1">No nutrition data</div>}
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