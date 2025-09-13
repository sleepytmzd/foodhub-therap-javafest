"use client";

import React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type VisitMini = {
  id: string;
  restaurantName: string;
  time: string;
  foods?: string[];
};

export type Restaurant = {
  id: string;
  name: string;
  description: string;
  rating: number;
  address?: string;
  cover?: string;
  tags?: string[];
  recentVisits?: VisitMini[];
};

export default function RestaurantCard({
  r,
  onView,
}: {
  r: Restaurant;
  onView: (r: Restaurant) => void;
}) {
  return (
    <article className="rounded-md border bg-card p-0 overflow-hidden shadow-sm">
      <div className="flex">
        <div
          className="w-36 h-24 bg-cover bg-center"
          style={{ backgroundImage: `url(${r.cover})` }}
        />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold">{r.name}</div>
              {r.address && <div className="text-xs text-muted-foreground mt-1">{r.address}</div>}
            </div>

            <div className="text-right">
              <div className="inline-flex items-center gap-1 bg-muted/10 px-2 py-1 rounded">
                <Star className="w-4 h-4 text-amber-500" /> <span className="font-medium">{r.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{r.description}</p>

          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" onClick={() => onView(r)}>View</Button>
            <a className="inline-flex items-center px-3 py-1 rounded border text-sm hover:bg-muted" href={`/restaurants/${r.id}`}>Open page</a>
          </div>
        </div>
      </div>
    </article>
  );
}