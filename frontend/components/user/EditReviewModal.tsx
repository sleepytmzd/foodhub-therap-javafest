"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EditReviewModal({
  open,
  review,
  onClose,
  onSave,
}: {
  open: boolean;
  review: any;
  onClose: () => void;
  onSave: (payload: { id: string; title: string; description: string }) => void;
}) {
  const [title, setTitle] = useState(review.title ?? "");
  const [description, setDescription] = useState(review.description ?? "");
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit review</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm">Title</label>
            <Input value={title} onChange={(e: any) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border px-3 py-2 bg-input" rows={6} />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button onClick={() => onSave({ id: review.id, title, description })}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}