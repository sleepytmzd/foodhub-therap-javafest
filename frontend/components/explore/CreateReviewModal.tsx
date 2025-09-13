"use client";

import React, { useState } from "react";
import { X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";

type OnCreate = (payload: {
  title: string;
  description: string;
  rating?: number;
}) => void;

export default function CreateReviewModal({
  open,
  onClose,
  onCreate,
  user,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: OnCreate;
  user: { id: string; name: string; avatar?: string } | null;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rating, setRating] = useState<number>(5);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      // do NOT call backend here — parent handles the POST.
      await onCreate({
        title: title || "Untitled",
        description,
        rating,
      });
      setTitle("");
      setDescription("");
      setRating(5);
      onClose();
    } catch (err) {
      console.error("create review (modal) failed", err);
      alert("Failed to create review. See console.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
      <div className="max-w-2xl w-full">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Create review</CardTitle>
            <button aria-label="close" onClick={onClose} className="p-2 rounded hover:bg-muted">
              <X className="w-5 h-5" />
            </button>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  {user?.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : <AvatarFallback>{user?.name?.[0] ?? "U"}</AvatarFallback>}
                </Avatar>
                <div>
                  <div className="font-medium">{user?.name}</div>
                  <div className="text-xs text-muted-foreground">Posting as you</div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Short title for your review" />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="mt-1 w-full rounded-md border px-3 py-2 bg-input text-foreground" placeholder="Write your experience..." />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Rating</label>
                <div className="inline-flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500" />
                  <Input type="number" min={0} max={5} value={String(rating)} onChange={(e) => setRating(Number(e.target.value))} className="w-20" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={saving}>{saving ? "Posting…" : "Post review"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}