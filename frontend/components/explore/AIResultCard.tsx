"use client";

import React from "react";
import { Card } from "@/components/ui/card";

export function RestaurantCardSmall({ r }: { r: { name: string; category?: string; location?: string } }) {
  return (
    <Card className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
      <div className="font-semibold">{r.name}</div>
      {r.category && <div className="text-xs text-muted-foreground mt-1">{r.category}</div>}
      {r.location && <div className="text-xs text-muted-foreground mt-2">{r.location}</div>}
    </Card>
  );
}

export function FoodCardSmall({ f }: { f: { name: string; category?: string; restaurant?: string; price?: number } }) {
  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
      <div className="font-semibold">{f.name}</div>
      <div className="text-xs text-muted-foreground mt-1">{f.category ?? "Food"}</div>
      {f.restaurant && <div className="text-xs text-muted-foreground mt-1">At: {f.restaurant}</div>}
      {typeof f.price === "number" && <div className="text-xs text-muted-foreground mt-1">Price: {f.price}</div>}
    </Card>
  );
}