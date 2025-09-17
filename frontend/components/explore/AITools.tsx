"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getRecommendations } from "@/lib/aiService";
import { RestaurantCardSmall, FoodCardSmall } from "./AIResultCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function AITools() {
  const [query, setQuery] = useState("");
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    if (!query.trim()) return alert("Please enter a query");
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await getRecommendations(query.trim(), { place: place || undefined });
      setResult(res);
    } catch (e: any) {
      console.error("AI request failed", e);
      setError("Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-md border p-4 bg-card-foreground/5">
        <h3 className="font-semibold">AI Tools — Recommendations</h3>
        <p className="text-sm text-muted-foreground mt-1">Ask the AI for food & restaurant recommendations.</p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <Label>Query</Label>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. best burgers near me" />
          </div>
          <div>
            <Label>Place (optional)</Label>
            <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City or plus-code" />
          </div>
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <Button variant="ghost" onClick={() => { setQuery(""); setPlace(""); setResult(null); }}>Clear</Button>
          <Button onClick={run} disabled={loading}>{loading ? "Thinking…" : "Get recommendations"}</Button>
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
            <div>
              <h4 className="font-semibold mb-2">Recommended restaurants</h4>
              {result.recommended_restaurants.length === 0 && <div className="text-sm text-muted-foreground">No recommended restaurants.</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.recommended_restaurants.map((r: any, i: number) => <RestaurantCardSmall key={i} r={r} />)}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Recommended foods</h4>
              {result.recommended_foods.length === 0 && <div className="text-sm text-muted-foreground">No recommended foods.</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.recommended_foods.map((f: any, i: number) => <FoodCardSmall key={i} f={f} />)}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Nearby restaurants</h4>
              {result.nearby_restaurants.length === 0 && <div className="text-sm text-muted-foreground">No nearby restaurants returned.</div>}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {result.nearby_restaurants.map((r: any, i: number) => <RestaurantCardSmall key={i} r={r} />)}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}