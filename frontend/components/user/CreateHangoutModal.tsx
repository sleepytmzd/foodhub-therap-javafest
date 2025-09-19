"use client";

import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHangout } from "@/lib/hangoutService";
import { RestaurantDto } from "@/lib/restaurantService";
import { fetchRestaurants as fetchRestaurantsApi } from "@/lib/restaurantService";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

export default function CreateHangoutModal({
  open,
  onOpenChange,
  targetUserId,
  targetUserName,
  token,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targetUserId: string;
  targetUserName?: string;
  token?: string;
}) {
  const { keycloak } = useAuth();
  const { toast } = useToast();

  const [message, setMessage] = useState("");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [allocTime, setAllocTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [restaurantQuery, setRestaurantQuery] = useState("");
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<RestaurantDto[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<RestaurantDto | null>(null);
  const [loadingRestaurants, setLoadingRestaurants] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const load = async () => {
      setLoadingRestaurants(true);
      try {
        const base = process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL || "";
        const list = await fetchRestaurantsApi(base, token);
        if (cancelled) return;
        setRestaurants(list || []);
        setFilteredRestaurants(list || []);
      } catch (e) {
        console.error("failed to load restaurants", e);
        setRestaurants([]);
        setFilteredRestaurants([]);
      } finally {
        if (!cancelled) setLoadingRestaurants(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, token]);

  useEffect(() => {
    if (!restaurantQuery.trim()) {
      setFilteredRestaurants(restaurants);
      return;
    }
    const q = restaurantQuery.trim().toLowerCase();
    const filtered = restaurants.filter((r) => {
      return (
        (r.name ?? "").toLowerCase().includes(q) ||
        (r.location ?? "").toLowerCase().includes(q) ||
        (r.category ?? "").toLowerCase().includes(q)
      );
    });
    setFilteredRestaurants(filtered);
  }, [restaurantQuery, restaurants]);

  const onSelectRestaurant = (r: RestaurantDto) => {
    setSelectedRestaurant(r);
    setRestaurantId(r.id ?? null);
    setRestaurantQuery(r.name ?? "");
    setFilteredRestaurants([]);
  };

  const onClearRestaurant = () => {
    setSelectedRestaurant(null);
    setRestaurantId(null);
    setRestaurantQuery("");
    setFilteredRestaurants(restaurants);
  };

  const onCreate = async () => {
    setSubmitting(true);
    try {
      const myId = keycloak?.tokenParsed?.sub ?? null;
      const payload = {
        message: message || null,
        userId1: myId ?? null,
        userId2: targetUserId ?? null,
        restaurantId: restaurantId ?? null,
        approvedByUser1: true, // requester auto-approves themselves
        approvedByUser2: null,
        allocatedTime: allocTime ?? null,
        foodIds: [],
      };
      await createHangout(payload, undefined, token);
      toast({ title: "Hangout request sent", description: "Invitation sent successfully." });
      onOpenChange(false);

      setMessage("");
      setAllocTime(null);
      onClearRestaurant();
    } catch (e) {
      console.error("create hangout failed", e);
      toast({ title: "Failed to send", description: "Could not send hangout request.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite {targetUserName ?? "user"} to hangout</DialogTitle>
        </DialogHeader>

        <div className="p-3 space-y-3">
          <div>
            <Label>Message</Label>
            <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Suggest a plan or message" />
          </div>

          <div>
            <Label>Time</Label>
            <Input type="datetime-local" value={allocTime ?? ""} onChange={(e) => setAllocTime(e.target.value || null)} />
          </div>

          <div>
            <Label>Restaurant</Label>
            <Input
              value={restaurantQuery}
              onChange={(e) => {
                setRestaurantQuery(e.target.value);
                setSelectedRestaurant(null);
                setRestaurantId(null);
              }}
              placeholder="Search restaurants by name / category / location"
            />
            <div className="text-xs text-muted-foreground mt-1">Pick a restaurant from the list</div>

            {/* Suggestion list */}
            {!selectedRestaurant && restaurantQuery.trim() !== "" && (
              <div className="mt-2 max-h-48 overflow-auto border rounded bg-card p-2">
                {loadingRestaurants && <div className="text-sm text-muted-foreground">Loading restaurants…</div>}
                {!loadingRestaurants && filteredRestaurants.length === 0 && (
                  <div className="text-sm text-muted-foreground">No matches found.</div>
                )}
                {!loadingRestaurants &&
                  filteredRestaurants.slice(0, 10).map((r) => (
                    <div
                      key={r.id}
                      className="p-2 rounded hover:bg-muted/50 cursor-pointer"
                      onClick={() => onSelectRestaurant(r)}
                    >
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-muted-foreground">{r.location} {r.category ? `· ${r.category}` : ""}</div>
                    </div>
                  ))}
              </div>
            )}

            {selectedRestaurant && (
              <div className="mt-2 flex items-center justify-between gap-2 p-2 border rounded bg-muted/5">
                <div>
                  <div className="font-medium">{selectedRestaurant.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedRestaurant.location} {selectedRestaurant.category ? `· ${selectedRestaurant.category}` : ""}</div>
                </div>
                <div>
                  <Button size="sm" variant="ghost" onClick={onClearRestaurant}>Clear</Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-3 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onCreate} disabled={submitting}>{submitting ? "Sending…" : "Send"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}