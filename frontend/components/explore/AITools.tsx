"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getRecommendations } from "@/lib/aiService";
import { RestaurantCardSmall, FoodCardSmall } from "./AIResultCard";
import { Skeleton } from "@/components/ui/skeleton";
import AIEntityModal from "./AIEntityModal";
import { useAuth } from "@/providers/AuthProvider";
import createApi from "@/lib/api";
import { useToast } from "@/components/ui/use-toast";
import { updateUser } from "@/lib/userService";
import { getRestaurantById } from "@/lib/restaurantService";
import { getFoodById } from "@/lib/foodService";

export default function AITools() {
  const { initialized, keycloak } = useAuth();
  const { toast } = useToast();
  const [coins, setCoins] = useState<number | null>(null);

  const [query, setQuery] = useState("");
  const [place, setPlace] = useState("");
  const [types, setTypes] = useState<"" | "food" | "restaurant" | "both">("");
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [topK, setTopK] = useState<number>(10);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selectedEntity, setSelectedEntity] = useState<any | null>(null);
  const [selectedType, setSelectedType] = useState<"food" | "restaurant" | null>(null);
  const [openEntityModal, setOpenEntityModal] = useState(false);

  // fetch coin balance for current user
  const fetchCoins = async () => {
    const userServiceBase = process.env.NEXT_PUBLIC_USER_SERVICE_URL || "";
    if (!initialized || !keycloak || !(keycloak as any).tokenParsed) return;
    const userId = (keycloak as any).tokenParsed.sub as string;
    try {
      const api = createApi(userServiceBase);
      if ((keycloak as any).token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${(keycloak as any).token}`;
      const resp = await api.get(`/api/user/${userId}`);
      setCoins(resp.data?.coins ?? 0);
    } catch {
      setCoins(null);
    }
  };

  useEffect(() => {
    if (initialized && keycloak) fetchCoins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, keycloak]);

  const run = async () => {
    if (!query.trim()) {
      toast({ title: "Enter query", description: "Please enter a query", variant: "destructive" });
      return;
    }
    if (!initialized || !keycloak || !(keycloak as any).tokenParsed) {
      toast({ title: "Sign in required", description: "Please sign in to use AI tools.", variant: "destructive" });
      return;
    }

    const userServiceBase = process.env.NEXT_PUBLIC_USER_SERVICE_URL || "";
    const userId = (keycloak as any).tokenParsed.sub as string;
    const apiUser = createApi(userServiceBase);
    if ((keycloak as any).token) (apiUser as any).defaults.headers.common["Authorization"] = `Bearer ${(keycloak as any).token}`;

    // ensure up-to-date coin balance and deduct 1 coin up-front
    let userData: any = null;
    try {
      const uResp = await apiUser.get(`/api/user/${userId}`);
      userData = uResp.data;
      const userCoins = (userData?.coins ?? 0);
      if (userCoins < 1) {
        toast({ title: "Insufficient coins", description: "You need at least 1 coin to use AI tools.", variant: "destructive" });
        return;
      }
      const payload = {
        id: userData.id,
        name: userData.name ?? "",
        firstName: userData.firstName ?? "",
        lastName: userData.lastName ?? "",
        email: userData.email ?? "",
        coverPhoto: userData.coverPhoto ?? null,
        userPhoto: userData.userPhoto ?? null,
        location: userData.location ?? null,
        totalCriticScore: userData.totalCriticScore ?? 0,
        coins: userCoins - 1,
        following: userData.following ?? [],
        followers: userData.followers ?? [],
        visits: userData.visits ?? [],
        criticScoreHistory: userData.criticScoreHistory ?? [],
        locationRecommendations: userData.locationRecommendations ?? [],
      };
      await updateUser(userId, payload, userServiceBase, (keycloak as any).token);
      setCoins((c) => (c != null ? c - 1 : null));
      toast({ title: "1 coin deducted", description: "Running AI recommendation…" });
    } catch (e) {
      console.error("coin check/deduct failed", e);
      toast({ title: "Error", description: "Could not verify or deduct coins.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const opts: any = {
        types: types === "both" ? undefined : types || undefined,
        max_price: maxPrice,
        restaurant: restaurantName || undefined,
        category: category || undefined,
        place: place || undefined,
        top_k: topK,
      };

      // call recommendation backend (this should return recommended_restaurants (ids), recommended_foods (ids), nearby_restaurants)
      const resp = await getRecommendations(query.trim(), opts);

      // normalize response object
      const recRestaurants: any[] = resp?.recommended_restaurants ?? [];
      const recFoods: any[] = resp?.recommended_foods ?? [];
      const nearby = resp?.nearby_restaurants ?? null;

      // resolve restaurant ids -> full records
      const token = (keycloak as any)?.token;
      const resolvedRestaurants = await Promise.all(
        recRestaurants.map(async (r: any) => {
          try {
            const id = typeof r === "string" ? r : r.db_id ?? r.id ?? null;
            if (!id) return { db_id: null, name: r?.name ?? String(r) };
            const full = await getRestaurantById(id, process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL, token);
            return { db_id: id, ...full };
          } catch (e) {
            console.warn("resolve restaurant failed", e);
            return { db_id: typeof r === "string" ? r : r.db_id ?? r.id ?? null, name: r?.name ?? String(r) };
          }
        })
      );

      // resolve food ids -> full records
      const resolvedFoods = await Promise.all(
        recFoods.map(async (f: any) => {
          try {
            const id = typeof f === "string" ? f : f.db_id ?? f.id ?? null;
            if (!id) return { db_id: null, name: f?.name ?? String(f) };
            const full = await getFoodById(id, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token);
            return { db_id: id, ...full };
          } catch (e) {
            console.warn("resolve food failed", e);
            return { db_id: typeof f === "string" ? f : f.db_id ?? f.id ?? null, name: f?.name ?? String(f) };
          }
        })
      );

      // set result to contain resolved records + nearby raw (no ids)
      setResult({
        recommended_restaurants: resolvedRestaurants,
        recommended_foods: resolvedFoods,
        nearby_restaurants: nearby,
      });

      toast({ title: "AI done", description: "Recommendations ready." });
    } catch (e: any) {
      // attempt refund one coin if AI failed
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
          await updateUser(userData.id, refundPayload, userServiceBase, (keycloak as any).token);
          setCoins((c) => (c != null ? c + 1 : null));
          toast({ title: "Refunded", description: "Coin refunded due to AI failure." });
        }
      } catch (rerr) {
        console.warn("refund failed", rerr);
      }
      console.error("AI request failed", e);
      toast({ title: "AI failed", description: "Failed to get recommendations.", variant: "destructive" });
      setError("Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="text-sm text-muted-foreground">Coins: <span className="font-medium">{coins ?? "—"}</span></div>
      <div className="rounded-md border p-4 bg-card-foreground/5">
        <h3 className="font-semibold">AI Tools — Recommendations</h3>
        <p className="text-sm text-muted-foreground mt-1">Ask the AI for food & restaurant recommendations.</p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Label>Query</Label>
            <Input className="bg-card" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. best burgers near me" />
          </div>

          <div>
            <Label>Place (optional)</Label>
            <Input className="bg-card" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City or plus-code" />
          </div>

          <div>
            <Label>Types</Label>
            <select value={types} onChange={(e) => setTypes(e.target.value as any)} className="w-full rounded border px-2 py-1 bg-card">
              <option value="">Any</option>
              <option value="food">Foods</option>
              <option value="restaurant">Restaurants</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div>
            <Label>Max price</Label>
            <Input className="bg-card" value={maxPrice ?? ""} onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : undefined)} placeholder="e.g. 500" />
          </div>

          <div>
            <Label>Category</Label>
            <Input className="bg-card" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Burger" />
          </div>

          <div>
            <Label>Restaurant (optional)</Label>
            <Input className="bg-card" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} placeholder="Restr. name to bias" />
          </div>
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => { setQuery(""); setPlace(""); setTypes(""); setMaxPrice(undefined); setCategory(""); setRestaurantName(""); setResult(null); }}>Clear</Button>
          <Button className="hover:scale-105 transition-transform" onClick={run} disabled={loading || (coins !== null && coins < 1)}>{loading ? "Thinking…" : "Get recommendations"}</Button>
        </div>
      </div>

      <div>
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        )}

        {error && <div className="text-sm text-destructive">{error}</div>}

        {result && (
          <div className="space-y-6">
            {/* Recommended restaurants */}
            <div>
              <h4 className="font-semibold mb-2">Recommended restaurants</h4>
              {(!result.recommended_restaurants || result.recommended_restaurants.length === 0) && <div className="text-sm text-muted-foreground">No recommended restaurants.</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(result.recommended_restaurants || []).map((r: any, i: number) => (
                  <RestaurantCardSmall
                    key={i}
                    r={{ name: r.name ?? r.resturantName ?? "Unknown", category: r.category, location: r.location, db_id: r.db_id }}
                    onClick={() => {
                      setSelectedEntity({ db_id: r.db_id ?? r.id ?? null, name: r.name });
                      setSelectedType("restaurant");
                      setOpenEntityModal(true);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Recommended foods */}
            {result.recommended_foods && result.recommended_foods.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recommended foods</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(result.recommended_foods || []).map((f: any, i: number) => (
                    <FoodCardSmall
                      key={i}
                      f={{ name: f.f_name ?? f.name ?? "Food", category: f.category, restaurant: f.restaurant, price: f.price, image_url: f.image_url, db_id: f.db_id }}
                      onClick={() => {
                        setSelectedEntity({ db_id: f.db_id ?? f.id ?? null, name: f.f_name ?? f.name });
                        setSelectedType("food");
                        setOpenEntityModal(true);
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Nearby restaurants returned by recommendation backend (no modal on click) */}
            {result.nearby_restaurants && result.nearby_restaurants.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Nearby restaurants (from recommendation)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.nearby_restaurants.map((nr: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 rounded-md border"
                      style={{
                        backgroundColor: "var(--card)",
                        color: "var(--card-foreground)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <div className="font-medium" style={{ color: "var(--card-foreground)" }}>{nr.name}</div>
                      <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{nr.location ?? "Unknown location"}</div>
                      {nr.category && <div className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>Category: {nr.category}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Entity details modal */}
      <AIEntityModal
        open={openEntityModal}
        onOpenChange={() => setOpenEntityModal(false)}
        entity={selectedEntity}
        type={selectedType}
      />
    </section>
  );
}
