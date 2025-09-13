"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function VisitCard({ visit, onDelete }: { visit: any; onDelete: () => void }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <div className="font-medium">{visit.resturantName}</div>
          {visit.location && <div className="text-xs text-muted-foreground">{visit.location}</div>}
          {visit.time && <div className="text-xs text-muted-foreground">{format(new Date(visit.time), "PPpp")}</div>}
        </div>

        <div>
          <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}