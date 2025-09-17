"use client";

import React, { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import RestaurantDetails from "./RestaurantDetails";

export type VisitMini = {
  id: string;
  restaurantName: string;
  time: string;
  foods?: string[];
};

export type Restaurant = {
  id: string;
  name: string;
  description?: string;
  location?: string;
  category?: string;
  weblink?: string;
  foodIdList?: string[] | null;
  rating?: number;
};

export default function RestaurantCard({
  r,
  onView,
}: {
  r: Restaurant;
  onView: (r: Restaurant) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <article className="rounded-md border bg-card p-0 overflow-hidden shadow-sm">
        <div className="flex">
          {/* <div
            className="w-36 h-24 bg-cover bg-center"
            style={{ backgroundImage: `url(${r.cover})` }}
          /> */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{r.name}</div>
                {r.location && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {r.location}
                  </div>
                )}
                {/* show summary info from recentVisits when available */}
                {/* {r.recentVisits && r.recentVisits.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {r.recentVisits.length} recent visit
                    {r.recentVisits.length !== 1 ? "s" : ""} ·{" "}
                    {r.recentVisits[0].time
                      ? new Date(r.recentVisits[0].time).toLocaleString()
                      : ""}
                  </div>
                )} */}
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 bg-muted/10 px-2 py-1 rounded">
                  <Star className="w-4 h-4 text-amber-500" />{" "}
                  {/* <span className="font-medium">{r.rating.toFixed(1)}</span> */}
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
              {r.description}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => {
                  onView(r);
                  setShowDetails(true);
                }}
              >
                View
              </Button>
              <a
                className="inline-flex items-center px-3 py-1 rounded border text-sm hover:bg-muted"
                href={`/restaurants/${r.id}`}
              >
                Open page
              </a>
            </div>
          </div>
        </div>
      </article>

      <RestaurantDetails
        restaurantId={r.id}
        open={showDetails}
        onClose={() => setShowDetails(false)}
      />
    </>
  );
}