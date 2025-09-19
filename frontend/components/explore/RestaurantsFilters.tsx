"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type RestaurantsFilterState = {
  name: string;
  description: string;
  category: string;
  location: string;
};

export default function RestaurantsFilters({
  filters,
  setFilters,
}: {
  filters: RestaurantsFilterState;
  setFilters: (f: RestaurantsFilterState) => void;
}) {
  return (
    <div className="rounded-md border p-4 bg-card-foreground/5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Restaurants filters</h3>
        <div />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Name</Label>
          <Input className="bg-card" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} placeholder="Filter by name" />
        </div>

        <div>
          <Label className="text-xs">Category</Label>
          <Input className="bg-card" value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} placeholder="Filter by category" />
        </div>

        <div>
          <Label className="text-xs">Location</Label>
          <Input className="bg-card" value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} placeholder="Filter by location" />
        </div>

        <div className="sm:col-span-2">
          <Label className="text-xs">Description</Label>
          <Input className="bg-card" value={filters.description} onChange={(e) => setFilters({ ...filters, description: e.target.value })} placeholder="Filter by description" />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setFilters({ name: "", description: "", category: "", location: "" })}>Clear</Button>
      </div>
    </div>
  );
}