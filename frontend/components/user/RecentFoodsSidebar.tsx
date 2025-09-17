"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import createApi from "@/lib/api";
import { FoodResponse } from "@/lib/foodService";
import Link from "next/link";

export default function RecentFoodsSidebar({ userId, token, onOpenAll }: { userId: string; token?: string; onOpenAll: () => void }) {
  const [foods, setFoods] = useState<FoodResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const api = createApi(process.env.NEXT_PUBLIC_FOOD_SERVICE_URL || "");
        if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const resp = await api.get<FoodResponse[]>("/api/food");
        const all = resp.data || [];
        const mine = all.filter((f) => String(f.user_id) === String(userId));
        if (!cancelled) setFoods(mine.slice(0, 3));
      } catch (e) {
        console.error("failed to load recent foods", e);
        if (!cancelled) setFoods([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (userId) load();
    return () => { cancelled = true; };
  }, [userId, token]);

  return (
    <div className="rounded-md border p-4 bg-card-foreground/5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Your recent foods</h3>
        <Link className="font-semibold text-sm" href={"/food/create"}>Create</Link>
        <Button size="sm" variant="ghost" onClick={onOpenAll}>See all</Button>
        
      </div>

      <ul className="mt-3 space-y-3">
        {loading && <li className="text-sm text-muted-foreground">Loading…</li>}
        {!loading && foods.length === 0 && <li className="text-sm text-muted-foreground">No foods yet.</li>}
        {foods.map((f) => (
          <li key={f.id} className="flex items-center gap-3">
            {f.image_url ? <img src={f.image_url} alt={f.f_name} className="w-10 h-10 rounded object-cover" /> : <div className="w-10 h-10 rounded bg-muted" />}
            <div className="flex-1">
              <div className="text-sm font-medium">{f.f_name}</div>
              <div className="text-xs text-muted-foreground">{f.category ?? "—"}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}