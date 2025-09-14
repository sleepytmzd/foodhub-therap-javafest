"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import createApi from "@/lib/api";
import type { FoodResponse } from "@/lib/foodService";
import { fetchRestaurantsFromVisits, createVisit as createVisitViaService } from "@/lib/visitService";
import { format } from "date-fns";

/*
Behavior summary:
- User picks target: "food" or "restaurant".
- If food: user can search existing foods (f_name). If not found, they can go to /food/create to create one.
- If restaurant: search restaurants (visits) or go to /restaurant/create to create one.
- When leaving to create page we persist modal draft to localStorage.
- When the create page finishes it writes created item to localStorage (createdFoodForReview / createdRestaurantForReview)
  and navigates back. This modal reads those keys on mount and picks the created item automatically.
- When user clicks Submit, we call onCreate with relevant selection data.
*/

export default function CreateReviewModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (payload: { targetType: "food" | "restaurant" | "general"; targetId?: string | null; title: string; description: string }) => Promise<void>;
}) {
  const router = useRouter();
  const { initialized, keycloak } = useAuth();
  const token = (keycloak as any)?.token ?? undefined;
  const isAuth = !!(initialized && keycloak && (keycloak as any).authenticated);

  const [targetType, setTargetType] = useState<"food" | "restaurant" | "general">("food");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [foodQuery, setFoodQuery] = useState("");
  const [foods, setFoods] = useState<FoodResponse[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodResponse | null>(null);

  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<any | null>(null);

  // fetch all foods once per modal open
  const fetchFoods = async () => {
    try {
      const api = createApi(process.env.NEXT_PUBLIC_FOOD_SERVICE_URL || "");
      if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
      const resp = await api.get<FoodResponse[]>("/api/food");
      setFoods(resp.data || []);
    } catch (e) {
      console.error("fetchFoods failed", e);
      setFoods([]);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const data = await fetchRestaurantsFromVisits(process.env.NEXT_PUBLIC_VISIT_SERVICE_URL || "", token);
      setRestaurants(data);
    } catch (e) {
      console.error("fetchRestaurants failed", e);
      setRestaurants([]);
    }
  };

  // persist / restore draft across navigation
  useEffect(() => {
    if (!open) return;
    // restore created items if any
    try {
      const createdFood = localStorage.getItem("createdFoodForReview");
      if (createdFood) {
        const f = JSON.parse(createdFood) as FoodResponse;
        setSelectedFood(f);
        localStorage.removeItem("createdFoodForReview");
        setTargetType("food");
      }
      const createdRestaurant = localStorage.getItem("createdRestaurantForReview");
      if (createdRestaurant) {
        const r = JSON.parse(createdRestaurant);
        setSelectedRestaurant(r);
        localStorage.removeItem("createdRestaurantForReview");
        setTargetType("restaurant");
      }
    } catch {}
    // fetch fresh lists
    fetchFoods();
    fetchRestaurants();
  }, [open, token]);

  // filtered lists by search query
  const filteredFoods = useMemo(() => {
    const q = foodQuery.trim().toLowerCase();
    if (!q) return foods;
    return foods.filter((f) => (f.f_name ?? "").toLowerCase().includes(q));
  }, [foods, foodQuery]);

  const filteredRestaurants = useMemo(() => {
    const q = restaurantQuery.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter((r) => (r.name ?? r.resturantName ?? "").toLowerCase().includes(q));
  }, [restaurants, restaurantQuery]);

  const openCreateFood = () => {
    // save draft so we can restore title/description when coming back
    const draft = { targetType, title, description, foodQuery, restaurantQuery, selectedRestaurantId: selectedRestaurant?.id ?? null };
    localStorage.setItem("pendingReviewDraft", JSON.stringify(draft));
    router.push("/food/create");
  };

  const openCreateRestaurant = () => {
    const draft = { targetType, title, description, foodQuery, restaurantQuery, selectedFoodId: selectedFood?.id ?? null };
    localStorage.setItem("pendingReviewDraft", JSON.stringify(draft));
    router.push("/restaurant/create");
  };

  // restore draft on modal mount (after returning from create page)
  useEffect(() => {
    if (!open) return;
    try {
      const d = localStorage.getItem("pendingReviewDraft");
      if (!d) return;
      const parsed = JSON.parse(d);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.foodQuery) setFoodQuery(parsed.foodQuery);
      if (parsed.restaurantQuery) setRestaurantQuery(parsed.restaurantQuery);
      localStorage.removeItem("pendingReviewDraft");
    } catch {}
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isAuth) return alert("Please sign in to create review");
    const payload = {
      targetType,
      targetId: targetType === "food" ? selectedFood?.id ?? null : targetType === "restaurant" ? selectedRestaurant?.id ?? null : null,
      title: title.trim(),
      description: description.trim(),
    };
    await onCreate(payload);
    // clear modal state
    setTitle("");
    setDescription("");
    setSelectedFood(null);
    setSelectedRestaurant(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Create review</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="flex gap-2">
            <Button type="button" variant={targetType === "food" ? "secondary" : "ghost"} onClick={() => setTargetType("food")}>Food</Button>
            <Button type="button" variant={targetType === "restaurant" ? "secondary" : "ghost"} onClick={() => setTargetType("restaurant")}>Restaurant</Button>
            <Button type="button" variant={targetType === "general" ? "secondary" : "ghost"} onClick={() => setTargetType("general")}>General</Button>
          </div>

          <div>
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short headline" />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Write your review..." className="w-full rounded-md border px-3 py-2 bg-input" rows={4} />
          </div>

          {targetType === "food" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Select food</label>
                <Button size="sm" type="button" onClick={openCreateFood}>Create food</Button>
              </div>
              <Input value={foodQuery} onChange={(e) => setFoodQuery(e.target.value)} placeholder="Search foods..." />
              <div className="max-h-48 overflow-auto rounded border p-2">
                {filteredFoods.length === 0 && <div className="text-sm text-muted-foreground">No foods found.</div>}
                {filteredFoods.map((f) => (
                  <div key={f.id} className={`p-2 rounded cursor-pointer ${selectedFood?.id === f.id ? "bg-muted/20" : ""}`} onClick={() => setSelectedFood(f)}>
                    <div className="flex items-center gap-3">
                      {f.image_url ? <img src={f.image_url} alt={f.f_name} className="w-12 h-12 rounded object-cover" /> : <div className="w-12 h-12 rounded bg-muted" />}
                      <div>
                        <div className="font-medium">{f.f_name}</div>
                        {f.description && <div className="text-xs text-muted-foreground">{f.description}</div>}
                        <div className="text-xs text-muted-foreground mt-1">Created by: {f.user_id ?? "unknown"}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedFood && <div className="text-xs text-muted-foreground">Selected: {selectedFood.f_name}</div>}
            </div>
          )}

          {targetType === "restaurant" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Select restaurant</label>
                <Button size="sm" type="button" onClick={openCreateRestaurant}>Create restaurant</Button>
              </div>

              <Input value={restaurantQuery} onChange={(e) => setRestaurantQuery(e.target.value)} placeholder="Search restaurants..." />
              <div className="max-h-48 overflow-auto rounded border p-2">
                {filteredRestaurants.length === 0 && <div className="text-sm text-muted-foreground">No restaurants found.</div>}
                {filteredRestaurants.map((r) => (
                  <div key={r.id} className={`p-2 rounded cursor-pointer ${selectedRestaurant?.id === r.id ? "bg-muted/20" : ""}`} onClick={() => setSelectedRestaurant(r)}>
                    <div className="font-medium">{r.name ?? r.resturantName}</div>
                    <div className="text-xs text-muted-foreground">{r.address ?? r.location ?? "Unknown location"} · {r.time ? format(new Date(r.time), "PPpp") : "No time"}</div>
                    <div className="text-xs text-muted-foreground mt-1">{(r.recentFoods || []).slice(0,3).join(", ")}</div>
                  </div>
                ))}
              </div>

              {selectedRestaurant && <div className="text-xs text-muted-foreground">Selected: {selectedRestaurant.name ?? selectedRestaurant.resturantName}</div>}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => { onOpenChange(false); }}>Cancel</Button>
            <Button type="submit" >Submit review</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}