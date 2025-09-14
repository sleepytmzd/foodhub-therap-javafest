"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { createVisit } from "@/lib/visitService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FoodResponse, FoodRequest, createFood, updateFood, foodApiClient } from "@/lib/foodService";
import { format } from "date-fns";

/*
Create "restaurant" using visit service (ignore userId/time fields per instruction).
Detect user's current geolocation to prefill location.
Allow adding existing foods (search) or creating new foods (navigates to /food/create, returns via localStorage).
On final submit: create restaurant (visit) with foods[] ids, then update each food.resturant_id to the new restaurant id.
*/

export default function CreateRestaurantPage() {
  const router = useRouter();
  const { initialized, keycloak } = useAuth();
  const token = (keycloak as any)?.token ?? undefined;
  const userId = (keycloak as any)?.tokenParsed?.sub ?? null;

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState(""); // used only client-side
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // food search / selection
  const [foodQuery, setFoodQuery] = useState("");
  const [foodsIndex, setFoodsIndex] = useState<FoodResponse[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<FoodResponse[]>([]);

  // detect browser location once on mount
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
      },
      (err) => {
        // ignore failure — user can type location manually
        console.warn("geolocation failed", err);
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  }, []);

  // fetch foods for search
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const api = foodApiClient(process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token);
        const resp = await api.get<FoodResponse[]>("/api/food");
        if (cancelled) return;
        setFoodsIndex(resp.data || []);
      } catch (e) {
        console.warn("fetch foods failed", e);
        setFoodsIndex([]);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  // restore a food created via /food/create (the food create page stores createdFoodForReview)
  useEffect(() => {
    try {
      const created = localStorage.getItem("createdFoodForReview");
      if (created) {
        const f = JSON.parse(created) as FoodResponse;
        // add to selected foods if not already present
        setSelectedFoods((s) => (s.find((x) => x.id === f.id) ? s : [...s, f]));
        // also ensure it's present in index
        setFoodsIndex((idx) => (idx.find((x) => x.id === f.id) ? idx : [f, ...idx]));
        localStorage.removeItem("createdFoodForReview");
      }
    } catch {
      // ignore
    }
  }, []);

  const filteredFoods = foodsIndex.filter((f) => {
    const q = foodQuery.trim().toLowerCase();
    if (!q) return true;
    return (f.f_name ?? "").toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q);
  });

  const toggleSelectFood = (f: FoodResponse) => {
    setSelectedFoods((s) => (s.find((x) => x.id === f.id) ? s.filter((x) => x.id !== f.id) : [...s, f]));
  };

  const openCreateFood = () => {
    // save draft so returning user sees current form
    const draft = { name, location, description, foodQuery, selectedFoodIds: selectedFoods.map((f) => f.id) };
    localStorage.setItem("pendingRestaurantDraft", JSON.stringify(draft));
    router.push("/food/create");
  };

  // restore draft when user returns from food creation cancellation
  useEffect(() => {
    try {
      const d = localStorage.getItem("pendingRestaurantDraft");
      if (!d) return;
      const parsed = JSON.parse(d);
      if (parsed.name) setName(parsed.name);
      if (parsed.location) setLocation(parsed.location);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.foodQuery) setFoodQuery(parsed.foodQuery);
      localStorage.removeItem("pendingRestaurantDraft");
    } catch {}
  }, []);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) { setError("Name required"); return; }
    setSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      // create restaurant as a visit (backend uses visit-service)
      const payload = {
        id: null,
        userId: null,
        location: location.trim() || null,
        time: now,
        resturantName: name.trim(),
        // send food ids (may be empty)
        foods: selectedFoods.length ? selectedFoods.map((f) => f.id) : null,
      };
      const created = await createVisit(payload, process.env.NEXT_PUBLIC_VISIT_SERVICE_URL, token);
      // update each selected food to include restaurant id
      if (created?.id && selectedFoods.length > 0) {
        await Promise.all(
          selectedFoods.map(async (f) => {
            try {
              const upd: Partial<FoodRequest> = { resturant_id: created.id };
              await updateFood(f.id, upd, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token);
            } catch (err) {
              console.warn("failed to update food with restaurant id", f.id, err);
            }
          })
        );
      }
      // store created restaurant for review flow and go back
      const createdForReview = { ...created, description };
      localStorage.setItem("createdRestaurantForReview", JSON.stringify(createdForReview));
      router.back();
    } catch (e) {
      console.error("create restaurant failed", e);
      setError("Failed to create restaurant");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">Create restaurant</h1>
      <form onSubmit={submit} className="space-y-4 bg-card rounded p-6">
        {error && <div className="text-sm text-destructive">{error}</div>}
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Location</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Latitude, Longitude or address" />
          <div className="text-xs text-muted-foreground mt-1">Detected (or typed): {location || "not set"}</div>
        </div>

        <div>
          <label className="text-sm font-medium">Description (optional)</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="rounded border p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-medium">Foods for this restaurant</div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" onClick={openCreateFood}>Create food</Button>
            </div>
          </div>

          <Input placeholder="Search foods..." value={foodQuery} onChange={(e) => setFoodQuery(e.target.value)} />

          <div className="max-h-48 overflow-auto mt-2 space-y-2">
            {filteredFoods.length === 0 && <div className="text-sm text-muted-foreground">No foods</div>}
            {filteredFoods.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-2 rounded border">
                <div className="flex-1">
                  <div className="font-medium">{f.f_name}</div>
                  {f.description && <div className="text-xs text-muted-foreground">{f.description}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">{f.user_id ?? "user"}</div>
                  <Button size="sm" type="button" variant={selectedFoods.find((x) => x.id === f.id) ? "secondary" : "ghost"} onClick={() => toggleSelectFood(f)}>
                    {selectedFoods.find((x) => x.id === f.id) ? "Selected" : "Add"}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3">
            <div className="font-medium mb-1">Selected foods</div>
            <div className="space-y-2">
              {selectedFoods.length === 0 && <div className="text-sm text-muted-foreground">No foods selected.</div>}
              {selectedFoods.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-2 rounded border">
                  {f.image_url ? <img src={f.image_url} alt={f.f_name} className="w-12 h-12 rounded object-cover" /> : <div className="w-12 h-12 rounded bg-muted" />}
                  <div className="flex-1">
                    <div className="font-medium">{f.f_name}</div>
                    {f.description && <div className="text-xs text-muted-foreground">{f.description}</div>}
                    <div className="text-xs text-muted-foreground mt-1">id: {f.id}</div>
                  </div>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setSelectedFoods((s) => s.filter((x) => x.id !== f.id))}>Remove</Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? `Saving…` : `Create restaurant`}</Button>
        </div>
      </form>
    </main>
  );
}