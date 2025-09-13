"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

export default function ReviewCard({
  review,
  onEdit,
  onDelete,
}: {
  review: any;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-medium">{review.title}</div>
            {review.createdAt && (
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={onEdit}>Edit</Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>Delete</Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground whitespace-pre-line">{review.description}</div>
      </CardContent>
    </Card>
  );
}