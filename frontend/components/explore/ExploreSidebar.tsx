"use client";

import React from "react";
import Link from "next/link";
import { Compass, MessageSquare, Cpu, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ExploreSidebar({
  view,
  setView,
}: {
  view: "reviews" | "restaurants";
  setView: (v: "reviews" | "restaurants") => void;
}) {
  return (
    <nav className="sticky top-24 space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>Explore</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setView("restaurants")}
                className={`flex w-full items-center gap-3 px-2 py-2 rounded ${view === "restaurants" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <Compass className="w-4 h-4" /> Discover restaurants
              </button>
            </li>
            <li>
              <button
                onClick={() => setView("reviews")}
                className={`flex w-full items-center gap-3 px-2 py-2 rounded ${view === "reviews" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                <MessageSquare className="w-4 h-4" /> Recent reviews
              </button>
            </li>
            <li>
              <Link href="/ai-tools" className="flex items-center gap-3 px-2 py-2 rounded hover:bg-muted">
                <Cpu className="w-4 h-4" /> AI Tools
              </Link>
            </li>
            <li>
              <Link href="/recipes" className="flex items-center gap-3 px-2 py-2 rounded hover:bg-muted">
                <BookOpen className="w-4 h-4" /> Recipe maker
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <Button size="sm" variant="ghost">Latest</Button>
            <Button size="sm" variant="ghost">Top rated</Button>
            <Button size="sm" variant="ghost">Nearby</Button>
          </div>
        </CardContent>
      </Card>
    </nav>
  );
}