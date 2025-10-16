"use client";

import React, { useEffect, useState } from "react";
import { Heart, MessageSquare, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import type { FoodResponse } from "@/lib/foodService";
import createApi from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";

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
  food?: FoodResponse | undefined;
  restaurant?: { id: string; name: string; location?: string; category?: string; weblink?: string } | undefined;
};

// simple in-memory cache to avoid refetching same user many times
const userDisplayCache: Record<string, { name: string; avatar?: string }> = {};

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
  const { initialized, keycloak } = useAuth();
  const token = (keycloak as any)?.token;
  const [displayUser, setDisplayUser] = useState<{ name: string; avatar?: string }>(() => ({
    name: post.user?.name || post.user?.id || "User",
    avatar: post.user?.avatar,
  }));

  useEffect(() => {
    let cancelled = false;
    const id = post.user?.id;
    if (!id) return;

    // if cached, use it immediately
    if (userDisplayCache[id]) {
      setDisplayUser(userDisplayCache[id]);
      return;
    }

    // use existing name/avatar as optimistic UI
    setDisplayUser((prev) => ({
      name: prev?.name || post.user?.name || id,
      avatar: prev?.avatar || post.user?.avatar,
    }));

    const load = async () => {
      try {
        const base = process.env.NEXT_PUBLIC_USER_SERVICE_URL || "";
        if (!base) return;
        const api = createApi(base);
        if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
        const resp = await api.get(`/api/user/${id}`);
        const d = resp.data || {};
        const name =
          (typeof d.name === "string" && d.name.trim()) ||
          [d.firstName, d.lastName].filter(Boolean).join(" ").trim() ||
          (typeof d.email === "string" ? d.email.split("@")[0] : "") ||
          id;
        const avatar: string | undefined =
          d.userPhoto || d.avatar || d.avatarUrl || d.profilePicture || d.photoUrl || undefined;
        const info = { name, avatar };
        userDisplayCache[id] = info;
        if (!cancelled) setDisplayUser(info);
      } catch {
        // keep optimistic fallback
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [post.user?.id, token]);

  return (
    <article className="rounded-md border bg-card p-4 shadow-sm hover:scale-101 transition-transform hover:shadow-lg">
      <header className="flex items-start gap-3">
        <Avatar className="size-12">
          {displayUser.avatar ? (
            <AvatarImage src={displayUser.avatar} alt={displayUser.name} />
          ) : (
            <AvatarFallback>{(displayUser.name || post.user.id || "U")[0]}</AvatarFallback>
          )}
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="font-medium">{displayUser.name}</div>
              <div className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })} {post.rating ? `· ⭐ ${post.rating}` : null}
              </div>
            </div>

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

          {/* Associated resource preview */}
          {post.food ? (
            <div className="mt-3 flex items-center gap-3 border rounded p-2 bg-muted/5">
              {post.food.image_url ? (
                <img src={post.food.image_url} alt={post.food.f_name} className="w-20 h-20 rounded object-cover border" />
              ) : (
                <div className="w-20 h-20 rounded bg-muted flex items-center justify-center text-xs">No image</div>
              )}
              <div className="flex-1">
                <div className="font-medium">{post.food.description}</div>
                {post.food.description && <div className="text-sm text-muted-foreground mt-1">{post.food.f_name}</div>}
                {post.food.resturant_id && <div className="text-xs text-muted-foreground mt-1">At: {post.food.resturant_id}</div>}
              </div>
            </div>
          ) : post.restaurant ? (
            <div className="mt-3 flex items-center gap-3 border rounded p-2 bg-muted/5">
              <div className="flex-1">
                <div className="font-medium">{post.restaurant.name}</div>
                {post.restaurant.category && <div className="text-xs text-muted-foreground mt-1">Category: {post.restaurant.category}</div>}
                {post.restaurant.location && <div className="text-xs text-muted-foreground mt-1">{post.restaurant.location}</div>}
              </div>
            </div>
          ) : null}

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