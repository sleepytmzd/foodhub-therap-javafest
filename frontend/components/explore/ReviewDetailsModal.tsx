"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import FeedPost, { ReviewPost } from "@/components/explore/FeedPost";
import CommentInput from "@/components/common/CommentInput";
import { Button } from "@/components/ui/button";
import { format } from "date-fns/format";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type Comment = { id: string; user: string; avatar:string; text: string; time: string };

export default function ReviewDetailsModal({
  open,
  onOpenChange,
  post,
  comments,
  isAuth,
  liked,
  onToggleLike,
  onPostComment,
  onRequireAuth,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  post: ReviewPost | null;
  comments: Comment[];
  isAuth: boolean;
  liked: boolean;
  onToggleLike: (id: string) => void;
  onPostComment: (reviewId: string, content: string) => Promise<void>;
  onRequireAuth: () => void;
}) {
  if (!post) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Review</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="rounded border p-3 bg-card">
            <FeedPost
              post={post}
              liked={liked}
              isAuth={isAuth}
              onToggleLike={(id) => (isAuth ? onToggleLike(id) : onRequireAuth())}
              onOpenComments={() => {}}
              onRequireAuth={onRequireAuth}
            />

            <div className="mt-4">
              <h4 className="font-medium">Comments</h4>
              <ul className="mt-2 space-y-3">
                {comments.length === 0 && <li className="text-sm text-muted-foreground">No comments yet.</li>}
                {comments.map((c) => (
                  <li key={c.id} className="flex items-start gap-3">
                    {/* <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                      {c.user?.[0] ?? "U"}
                    </div> */}
                    <Avatar className="size-6">
                      {c.avatar ? (
                        <AvatarImage src={c.avatar} alt={c.user} />
                      ) : (
                        <AvatarFallback>{c.user?.[0] ?? "U"}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="text-sm"><strong>{c.user}</strong> <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(c.time), { addSuffix: true })}</span></div>
                      <div className="text-sm text-muted-foreground mt-1">{c.text}</div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-3">
                {isAuth ? (
                  <CommentInput
                    onPost={async (text) => {
                      await onPostComment(post.id, text);
                    }}
                  />
                ) : (
                  <div className="text-sm text-muted-foreground">Sign in to post a comment.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}