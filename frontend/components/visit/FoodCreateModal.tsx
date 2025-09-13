"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createFood, FoodResponse } from "@/lib/foodService";

export default function FoodCreateModal({
  open,
  onClose,
  onCreated, // called with newly created food object
  token,
  foodServiceBase,
  restaurantId,
  createdBy,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (food: FoodResponse) => void;
  token?: string | null;
  foodServiceBase?: string;
  restaurantId?: string | null;
  createdBy?: string | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError("Food name is required");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      // Build payload using backend DTO field names
      const payload = {
        id: null,
        description: description.trim() || null,
        f_name: name.trim(),
        category: null,
        nutrition_table: null,
        resturant_id: restaurantId ?? null,
        image_url: null,
        user_id: createdBy ?? null,
      };
      const created = await createFood(payload, foodServiceBase, token ?? undefined, image ?? undefined);
      if (created && created.id) {
        onCreated(created); // send full object back
        // clear form for next input
        setName("");
        setDescription("");
        setImage(null);
      }
    } catch (err) {
      console.error("createFood failed", err);
      setError("Failed to create food");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add food</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3 mt-2">
          {error && <div className="text-sm text-destructive">{error}</div>}
          <div>
            <label className="text-sm font-medium">Food name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Carbonara" />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional notes" />
          </div>

          <div>
            <label className="text-sm font-medium">Image (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setImage(f);
              }}
              className="mt-1"
            />
            {image && <div className="text-xs text-muted-foreground mt-1">{image.name}</div>}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => onClose()}>Done</Button>
            <Button type="submit" disabled={saving}>{saving ? "Adding…" : "Add & keep"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}