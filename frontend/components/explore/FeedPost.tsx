"use client";

import React from "react";
import { Heart, MessageSquare, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

type Comment = { id: string; user: string; text: string; time: string };
export type ReviewPost = {
  id: string;
  user: { id: string; name: string; avatar?: string };
  title: string;
  description: string;
  rating?: number;
  createdAt: string;
  comments: Comment[];
  likes: string[];
  sentiment?: "positive" | "neutral" | "negative" | null;
};

export default function FeedPost({
  post,
  liked,
  isAuth,
  onToggleLike,
  onOpenComments,
  onRequireAuth,
}: {
  post: ReviewPost;
  liked?: boolean;
  isAuth: boolean;
  onToggleLike: (id: string) => void;
  onOpenComments: (p: ReviewPost) => void;
  onRequireAuth: () => void;
}) {
  console.log(post);
  
  return (
    <article className="rounded-md border bg-card p-4 shadow-sm">
      <header className="flex items-start gap-3">
        <Avatar className="size-12">
          {post.user.avatar ? (
            <AvatarImage src={post.user.avatar} alt={post.user.name} />
          ) : (
            <AvatarFallback>{post.user.name?.[0] ?? "U"}</AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-medium">

                {post.user.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} {post.rating ? `· ⭐ ${post.rating}` : null}
              </div>
            </div>

            {/* <button className="p-1 rounded hover:bg-muted" aria-label="more">
              <MoreHorizontal className="w-4 h-4" />
            </button> */}
            {post.sentiment ? (
              <span
                className={`px-2 py-1 text-xs font-medium rounded
                  ${
                    post.sentiment === "positive"
                      ? "bg-primary text-primary-foreground"
                      : post.sentiment === "negative"
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                {post.sentiment.charAt(0).toUpperCase() + post.sentiment.slice(1)}
              </span>
            ) : null}

          </div>

          <div className="mt-2 text-foreground">
            <h3 className="mt-3 font-semibold">{post.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-4">{post.description}</p>
          </div>

          <div className="mt-3 flex items-center gap-3">
            <Button
              size="sm"
              variant={liked ? "default" : "ghost"}
              onClick={() => (isAuth ? onToggleLike(post.id) : onRequireAuth())}
              className="inline-flex items-center gap-2"
            >
              <Heart className="w-4 h-4" /> {post.likes.length} {liked ? "Liked" : "Like"}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => onOpenComments(post)}
              className="inline-flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> {post.comments.length} comments
            </Button>
          </div>
        </div>
      </header>
    </article>
  );
}