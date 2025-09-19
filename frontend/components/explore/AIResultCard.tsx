"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import clsx from "clsx";

export function RestaurantCardSmall({
  r,
  onClick,
}: {
  r: { name: string; category?: string; location?: string; db_id?: string };
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={clsx(
        "p-4 cursor-pointer transition-shadow hover:shadow-md",
        // light -> warm; dark -> deep warm
        "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200",
        "dark:from-amber-900 dark:to-amber-800 dark:border-amber-700"
      )}
    >
      <div className="font-semibold">{r.name}</div>
      {r.category && <div className="text-xs text-muted-foreground mt-1">{r.category}</div>}
      {r.location && <div className="text-xs text-muted-foreground mt-2">{r.location}</div>}
    </Card>
  );
}

export function FoodCardSmall({
  f,
  onClick,
}: {
  f: { name: string; category?: string; restaurant?: string; price?: number; image_url?: string; db_id?: string };
  onClick?: () => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={clsx(
        "p-4 cursor-pointer transition-shadow hover:shadow-md flex items-center gap-3",
        "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200",
        "dark:from-emerald-900 dark:to-emerald-800 dark:border-emerald-700"
      )}
    >
      <div className="w-14 h-14 rounded overflow-hidden flex-shrink-0">
        {f.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-xs">No image</div>
        )}
      </div>

      <div className="flex-1">
        <div className="font-semibold">{f.name}</div>
        <div className="text-xs text-muted-foreground mt-1">{f.category ?? "Food"}</div>
        {f.restaurant && <div className="text-xs text-muted-foreground mt-1">At: {f.restaurant}</div>}
        {typeof f.price === "number" && <div className="text-xs text-muted-foreground mt-1">Price: {f.price}</div>}
      </div>
    </Card>
  );
}