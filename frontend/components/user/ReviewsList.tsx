// ...new file...
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function ReviewsList({
  reviews,
  onEdit,
  onDelete,
}: {
  reviews: { id: string; title: string; description: string; createdAt?: string | null }[];
  onEdit: (payload: { id: string; title: string; description: string }) => void;
  onDelete: (id: string) => void;
}) {
  if (!reviews || reviews.length === 0) {
    return <div className="text-sm text-muted-foreground">You have no reviews yet.</div>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <Card key={r.id}>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium">{r.title}</div>
                {r.createdAt && <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</div>}
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => onEdit({ id: r.id, title: r.title, description: r.description })}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(r.id)}>Delete</Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground whitespace-pre-line">{r.description}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}