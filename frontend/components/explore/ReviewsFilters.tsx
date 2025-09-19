"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type ReviewsFilterState = {
  title: string;
  description: string;
  username: string;
  sentiment: "" | "positive" | "neutral" | "negative";
};

export default function ReviewsFilters({
  filters,
  setFilters,
  sort,
  setSort,
}: {
  filters: ReviewsFilterState;
  setFilters: (f: ReviewsFilterState) => void;
  sort: "newest" | "likes" | "comments";
  setSort: (s: "newest" | "likes" | "comments") => void;
}) {
  return (
    <div className="rounded-md border p-4 bg-card-foreground/5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Reviews filters</h3>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Sort</Label>
          <Select onValueChange={(v) => setSort(v as any)} value={sort}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="likes">Most likes</SelectItem>
              <SelectItem value="comments">Most comments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Title</Label>
          <Input className="bg-card" value={filters.title} onChange={(e) => setFilters({ ...filters, title: e.target.value })} placeholder="Filter by title" />
        </div>

        <div>
          <Label className="text-xs">Username</Label>
          <Input className="bg-card" value={filters.username} onChange={(e) => setFilters({ ...filters, username: e.target.value })} placeholder="Filter by user" />
        </div>

        <div className="sm:col-span-2">
          <Label className="text-xs">Description</Label>
          <Input className="bg-card" value={filters.description} onChange={(e) => setFilters({ ...filters, description: e.target.value })} placeholder="Filter by description" />
        </div>

        <div>
          <Label className="text-xs">Sentiment</Label>
          <Select onValueChange={(v) => setFilters({ ...filters, sentiment: v as any })} value={filters.sentiment}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card">
              {/* <SelectItem value="">All</SelectItem> */}
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => setFilters({ title: "", description: "", username: "", sentiment: "" })}>Clear</Button>
      </div>
    </div>
  );
}