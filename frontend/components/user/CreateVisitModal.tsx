"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function CreateVisitModal({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (payload: { resturantName: string; location?: string; time?: string; foods?: string[] }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create visit</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <label className="text-sm">Restaurant name</label>
            <Input value={name} onChange={(e: any) => setName(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Location</label>
            <Input value={location} onChange={(e: any) => setLocation(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Time (optional ISO)</label>
            <Input value={time} onChange={(e: any) => setTime(e.target.value)} placeholder={new Date().toISOString()} />
          </div>

          <div className="flex justify-end gap-2 mt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={async () => { await onCreate({ resturantName: name, location: location || undefined, time: time || undefined }); }}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}