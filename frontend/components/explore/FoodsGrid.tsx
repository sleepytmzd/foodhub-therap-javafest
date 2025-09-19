"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchFoods as fetchFoodsApi, FoodResponse } from "@/lib/foodService";
import { useAuth } from "@/providers/AuthProvider";
import FoodDetailsModal from "./FoodDetailsModal";

export default function FoodsGrid() {
  const { initialized, keycloak } = useAuth();
  const isAuth = !!(initialized && keycloak && (keycloak as any).authenticated);
  const [loading, setLoading] = useState(true);
  const [foods, setFoods] = useState<FoodResponse[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodResponse | null>(null);
  const [open, setOpen] = useState(false);

  const token = (keycloak as any)?.token;

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchFoodsApi(process.env.NEXT_PUBLIC_FOOD_SERVICE_URL || "", token);
      setFoods(data || []);
    } catch (e) {
      console.error("fetchFoods failed", e);
      setFoods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Foods</h3>
        <div className="flex items-center gap-2">
          <Link href="/food/create">
            <Button size="sm">{isAuth ? "Create food" : "Sign in to create"}</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <>
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
          <Skeleton className="h-20 w-full rounded-md" />
        </>
      ) : foods.length === 0 ? (
        <div className="rounded border p-4 text-center text-muted-foreground">No foods found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {foods.map((f) => (
            <article key={f.id} className="rounded-md border p-3 bg-card hover:shadow-sm transition-shadow hover:scale-102">
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                  {f.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.image_url} alt={f.f_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs">No image</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-medium">{f.f_name}</div>
                  {f.category && <div className="text-xs text-muted-foreground mt-1">{f.category}</div>}
                  {f.description && <div className="text-xs text-muted-foreground mt-1">{f.description}</div>}
                </div>

                <div className="ml-2 flex flex-col items-end gap-2">
                  <div className="text-sm text-muted-foreground">{f.price != null ? `${f.price}` : ""}</div>
                  <Button size="sm" onClick={() => { setSelectedFood(f); setOpen(true); }}>View details</Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <FoodDetailsModal open={open} onOpenChange={setOpen} food={selectedFood} token={token} />
    </div>
  );
}