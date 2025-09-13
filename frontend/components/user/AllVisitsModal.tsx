"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AllVisitsModal({
  open,
  onOpenChange,
  visits,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  visits: { id: string; restaurantName: string; time: string; location?: string | null }[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>All visits</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {visits.length === 0 && <div className="text-sm text-muted-foreground">No visits recorded.</div>}
          {visits.map((v) => (
            <div key={v.id} className="rounded border p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{v.restaurantName}</div>
                {v.location && <div className="text-xs text-muted-foreground">{v.location}</div>}
              </div>
              <div className="text-xs text-muted-foreground">{v.time}</div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}