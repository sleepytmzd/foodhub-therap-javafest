"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { createVisit, deleteVisit, updateVisit, VisitRequest, VisitResponse } from "@/lib/visitService";
import { fetchUserById, addVisitToUser } from "@/lib/userService";
import FoodCreateModal from "@/components/visit/FoodCreateModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { FoodResponse } from "@/lib/foodService";
import { deleteFood } from "@/lib/foodService";

export default function CreateVisitPage() {
  const router = useRouter();
  const { initialized, keycloak } = useAuth();
  const isAuth = !!(initialized && keycloak && (keycloak as any).authenticated);
  const userId = (keycloak as any)?.tokenParsed?.sub ?? null;
  const token = (keycloak as any)?.token ?? undefined;

  const [restaurantName, setRestaurantName] = useState("");
  const [creatingVisit, setCreatingVisit] = useState(false);
  const [visitCreated, setVisitCreated] = useState<VisitResponse | null>(null);
  const [savedRestaurantId, setSavedRestaurantId] = useState<string | null>(null);
  const [foodModalOpen, setFoodModalOpen] = useState(false);
  // store full food objects instead of only ids
  const [foods, setFoods] = useState<FoodResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  // fetch user's location to pre-fill visit location when creating visit
  const [userLocation, setUserLocation] = useState<string | null>(null);
  useEffect(() => {
    if (!initialized || !userId) return;
    (async () => {
      try {
        const u = await fetchUserById(userId, process.env.NEXT_PUBLIC_USER_SERVICE_URL, token);
        setUserLocation(u.location ?? null);
      } catch (err) {
        console.warn("could not fetch user location", err);
      }
    })();
  }, [initialized, userId, token]);

  const handleCreateVisit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!isAuth) {
      setError("Sign in to add a visit");
      return;
    }
    if (!restaurantName.trim()) {
      setError("Restaurant name required");
      return;
    }
    setError(null);
    setCreatingVisit(true);
    try {
      const now = new Date().toISOString();
      // foods null per your instruction
      const payload: VisitRequest = {
        id: null,
        userId,
        location: userLocation ?? null,
        time: now,
        resturantName: restaurantName.trim(),
        foods: null,
      };
      const created = await createVisit(payload, process.env.NEXT_PUBLIC_VISIT_SERVICE_URL, token);
      // update user's visits list to include this new visit id
      if (userId) {
        try {
          await addVisitToUser(userId, created.id, process.env.NEXT_PUBLIC_USER_SERVICE_URL, token);
        } catch (err) {
          console.warn("failed to update user with new visit id", err);
        }
      }
      setVisitCreated(created);
      // save the returned id as "restaurant id" per your flow
      setSavedRestaurantId(created.id);
      // open modal to create foods
      setFoodModalOpen(true);
    } catch (err) {
      console.error("create visit failed", err);
      setError("Failed to create visit");
    } finally {
      setCreatingVisit(false);
    }
  };

  // receive full FoodResponse objects now
  const handleFoodCreated = (food: FoodResponse) => {
    setFoods((s) => [...s, food]);
  };

  const finishAndUpdateVisit = async () => {
    if (!visitCreated) return;
    setError(null);
    try {
      // build update payload: set foods list with food ids and put savedRestaurantId into id field as requested
      const payload: VisitRequest = {
        id: savedRestaurantId ?? visitCreated.id, // put restaurant id into id field per your instruction
        userId: visitCreated.userId ?? userId,
        location: visitCreated.location ?? userLocation ?? null,
        time: visitCreated.time ?? new Date().toISOString(),
        resturantName: visitCreated.resturantName ?? restaurantName,
        foods: foods.length ? foods.map((f) => f.id) : [],
      };
      // update using original visit id (visitCreated.id)
      await updateVisit(visitCreated.id, payload, process.env.NEXT_PUBLIC_VISIT_SERVICE_URL, token);
      // navigate back to profile to show the new visit
      router.push("/user");
    } catch (err) {
      console.error("update visit failed", err);
      setError("Failed to finalize visit");
    }
  };

  // cancel handler: delete created foods and created visit then navigate back
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    // if nothing was created, just navigate away
    if (!visitCreated) {
      router.push("/user");
      return;
    }
    if (cancelling) return;
    setCancelling(true);
    try {
      // delete created foods (use foods array which stores full objects)
      for (const f of foods) {
        try {
          await deleteFood(f.id, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token);
        } catch (err) {
          console.warn("failed to delete food", f.id, err);
        }
      }
      // delete the created visit
      try {
        await deleteVisit(visitCreated.id, process.env.NEXT_PUBLIC_VISIT_SERVICE_URL, token);
      } catch (err) {
        console.warn("failed to delete visit", visitCreated.id, err);
      }
    } finally {
      setCancelling(false);
      router.push("/user");
    }
  };

  // wire Cancel button to handleCancel
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">Add visit</h1>

      <form onSubmit={handleCreateVisit} className="space-y-4 bg-card rounded p-6">
        {error && <div className="text-sm text-destructive">{error}</div>}

        <div>
          <label className="text-sm font-medium">Restaurant name</label>
          <Input value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="Restaurant name" />
        </div>

        <div>
          <label className="text-sm font-medium">Location (from profile)</label>
          <div className="text-sm text-muted-foreground mt-1">{userLocation ?? "Unknown"}</div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={handleCancel} disabled={cancelling}>
            {cancelling ? "Cancelling…" : "Cancel"}
          </Button>
          <Button type="submit" disabled={creatingVisit}>{creatingVisit ? "Creating…" : "Create visit & add foods"}</Button>
        </div>
      </form>

      <FoodCreateModal
        open={foodModalOpen}
        onClose={() => setFoodModalOpen(false)}
        onCreated={handleFoodCreated}
        token={token}
        foodServiceBase={process.env.NEXT_PUBLIC_FOOD_SERVICE_URL}
        restaurantId={savedRestaurantId}
        createdBy={userId}
      />

      {visitCreated && (
        <div className="mt-6 bg-card rounded p-4">
          <div className="font-medium">Visit summary</div>
          <div className="text-sm text-muted-foreground">Restaurant: {visitCreated.resturantName}</div>
          <div className="text-sm text-muted-foreground">Location: {visitCreated.location ?? "Unknown"}</div>
          <div className="text-sm text-muted-foreground">Time: {visitCreated.time ?? "Unknown"}</div>

          <div className="mt-4">
            <div className="mb-2 font-medium">Foods added</div>
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
                    {/* <div className="text-xs text-muted-foreground mt-1">Food id: {f.id}</div> */}
                  </div>
                </li>
              ))}
              {foods.length === 0 && <li className="text-sm text-muted-foreground">No foods added yet.</li>}
            </ul>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setFoodModalOpen(true)}>Add more</Button>
              <Button onClick={finishAndUpdateVisit} disabled={foods.length === 0}>Finish visit</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}