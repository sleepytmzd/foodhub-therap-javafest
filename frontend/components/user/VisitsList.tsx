// ...new file...
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function VisitsList({
  visits,
  onDelete,
  onCreate,
}: {
  visits: { id: string; restaurantName: string; time: string; location?: string | null }[];
  onDelete: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-2">
        <Button size="sm" onClick={onCreate}>Create visit</Button>
      </div>

      {(!visits || visits.length === 0) && <div className="text-sm text-muted-foreground">You have no visits yet.</div>}

      {visits.map((v) => (
        <Card key={v.id}>
          <CardContent className="flex items-center justify-between">
            <div>
              <div className="font-medium">{v.restaurantName}</div>
              {v.location && <div className="text-xs text-muted-foreground">{v.location}</div>}
              {v.time && <div className="text-xs text-muted-foreground">{format(new Date(v.time), "PPpp")}</div>}
            </div>

            <div>
              <Button size="sm" variant="destructive" onClick={() => onDelete(v.id)}>Delete</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}