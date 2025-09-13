"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/providers/AuthProvider";
import createApi from "@/lib/api";
import FeedPost, { ReviewPost } from "@/components/explore/FeedPost";

type ReviewResponse = {
  id: string;
  title: string;
  description: string;
  foodId: string | null;
  resturantId: string | null;
  userId: string | null;
  reactionCountLike: number;
  reactionCountDislike: number;
  reactionUsersLike: string[] | null;
  reactionUsersDislike: string[] | null;
  comments: string[] | null; // comment ids
  createdAt: string | null;
  updatedAt: string | null;
};

export default function AllReviewsModal({
  open,
  onOpenChange,
  profileUserId,
  profileUserName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  profileUserId: string;
  profileUserName?: string | null;
}) {
  const { initialized, keycloak } = useAuth();
  const isAuth = !!(initialized && keycloak && (keycloak as any).authenticated);
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [rawMap, setRawMap] = useState<Record<string, ReviewResponse>>({});
  const [commentsByReview, setCommentsByReview] = useState<Record<string, { id: string; user: string; text: string; time: string }[]>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});

  const reviewApiBase = process.env.NEXT_PUBLIC_REVIEW_SERVICE_URL || "";
  const userApiBase = process.env.NEXT_PUBLIC_USER_SERVICE_URL || reviewApiBase;

  const reviewApi = () => {
    const api = createApi(reviewApiBase);
    if (isAuth && keycloak?.token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
    return api;
  };
  const userApi = () => {
    const api = createApi(userApiBase);
    if (isAuth && keycloak?.token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
    return api;
  };

  // fetch all reviews and filter by profile user id, plus fetch comments and commenter names
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    const load = async () => {
      try {
        const api = reviewApi();
        const resp = await api.get<ReviewResponse[]>("/api/review");
        const all = resp.data || [];
        const mine = all.filter((r) => String(r.userId) === String(profileUserId));
        const raw: Record<string, ReviewResponse> = {};
        mine.forEach((r) => (raw[r.id] = r));
        if (cancelled) return;
        setRawMap(raw);

        // map to ReviewPost
        const mapped: ReviewPost[] = mine.map((r) => ({
          id: r.id,
          user: { id: r.userId ?? "unknown", name: profileUserName ?? (r.userId ?? "User"), avatar: undefined },
          title: r.title ?? "(no title)",
          description: r.description ?? "",
          rating: undefined,
          createdAt: r.createdAt ? String(r.createdAt) : "",
          comments: [], // will fill from commentsByReview
        }));
        setPosts(mapped);

        // init liked map
        const myId = (keycloak as any)?.tokenParsed?.sub ?? null;
        const likesMap: Record<string, boolean> = {};
        mine.forEach((r) => {
          likesMap[r.id] = (r.reactionUsersLike ?? []).includes(myId);
        });
        setLiked(likesMap);

        // fetch comments for each review in parallel
        await Promise.all(
          mine.map(async (r) => {
            try {
              const cResp = await api.get(`/api/comment/review/${r.id}`);
              const commentsData = cResp.data || [];
              // fetch commenter names (best-effort)
              const commenterIds = Array.from(new Set(commentsData.map((c: any) => c.userId).filter(Boolean))) as string[];
              const nameMap: Record<string, string> = {};
              await Promise.all(
                commenterIds.map(async (uid) => {
                  try {
                    const uResp = await userApi().get(`/api/user/${uid}`);
                    const d = uResp.data;
                    if (d && d.name) nameMap[uid as string] = d.name;
                  } catch {
                    /* ignore */
                  }
                })
              );
              const commentsMapped = (commentsData || []).map((c: any) => ({
                id: c.id,
                user: nameMap[c.userId] ?? c.userId ?? "User",
                text: c.content ?? "",
                time: c.createdAt ? String(c.createdAt) : "",
              }));
              if (!cancelled) setCommentsByReview((s) => ({ ...s, [r.id]: commentsMapped }));
            } catch {
              // ignore per-review comment errors
            }
          })
        );
      } catch (e) {
        console.error("AllReviewsModal load failed", e);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, profileUserId, profileUserName, initialized]);

  const toggleLike = async (id: string) => {
    if (!isAuth) return alert("Please sign in to like");
    try {
      setLiked((s) => ({ ...s, [id]: !s[id] }));
      const raw = rawMap[id];
      if (!raw) return;
      const myId = (keycloak as any)?.tokenParsed?.sub ?? "me";
      const usersLike = Array.from(raw.reactionUsersLike ?? []);
      const already = usersLike.includes(myId);
      const updatedUsersLike = already ? usersLike.filter((u) => u !== myId) : [...usersLike, myId];
      const payload = {
        id: raw.id,
        title: raw.title,
        description: raw.description,
        foodId: raw.foodId,
        resturantId: raw.resturantId,
        userId: raw.userId,
        reactionCountLike: updatedUsersLike.length,
        reactionCountDislike: raw.reactionCountDislike ?? 0,
        reactionUsersLike: updatedUsersLike,
        reactionUsersDislike: raw.reactionUsersDislike ?? [],
        comments: raw.comments ?? [],
        createdAt: raw.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await reviewApi().put(`/api/review/${id}`, payload);
      // refresh single review state
      const refreshed = await reviewApi().get<ReviewResponse[]>("/api/review");
      const found = (refreshed.data || []).find((r) => r.id === id);
      if (found) setRawMap((m) => ({ ...m, [id]: found }));
    } catch (e) {
      console.error("toggleLike failed", e);
      setLiked((s) => ({ ...s, [id]: !s[id] }));
    }
  };

  const postComment = async (reviewId: string, content: string) => {
    if (!isAuth) return alert("Please sign in to comment");
    try {
      const api = reviewApi();
      const now = new Date().toISOString();
      const myId = (keycloak as any)?.tokenParsed?.sub ?? "me";
      const payload = {
        id: null,
        reviewId,
        userId: myId,
        content,
        createdAt: now,
        updatedAt: now,
      };
      await api.post("/api/comment", payload);
      // refresh comments for that review
      const cResp = await api.get(`/api/comment/review/${reviewId}`);
      const commentsData = cResp.data || [];
      // try to resolve commenter names
      const commenterIds = Array.from(new Set(commentsData.map((c: any) => c.userId).filter(Boolean)));
      const nameMap: Record<string, string> = {};
      await Promise.all(
        commenterIds.map(async (uid) => {
          try {
            const uResp = await userApi().get(`/api/user/${uid}`);
            const d = uResp.data;
            if (d && d.name) nameMap[uid as string] = d.name;
          } catch {}
        })
      );
      const commentsMapped = (commentsData || []).map((c: any) => ({
        id: c.id,
        user: nameMap[c.userId] ?? c.userId ?? "User",
        text: c.content ?? "",
        time: c.createdAt ? String(c.createdAt) : "",
      }));
      setCommentsByReview((s) => ({ ...s, [reviewId]: commentsMapped }));
    } catch (e) {
      console.error("postComment failed", e);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>All reviews</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {posts.length === 0 && <div className="text-sm text-muted-foreground">No reviews yet.</div>}

          {posts.map((p) => (
            <div key={p.id} className="rounded border p-3 bg-card">
              <FeedPost
                post={{
                  ...p,
                  comments: commentsByReview[p.id] ?? [],
                }}
                liked={!!liked[p.id]}
                isAuth={isAuth}
                onToggleLike={() => toggleLike(p.id)}
                onOpenComments={() => {
                  // noop: comments are already visible below the post
                }}
                onRequireAuth={() => alert("Please sign in to perform this action.")}
              />

              {/* Inline comments list + input */}
              <div className="mt-3">
                <h4 className="text-sm font-medium">Comments</h4>
                <ul className="mt-2 space-y-2">
                  {(commentsByReview[p.id] || []).length === 0 && <li className="text-sm text-muted-foreground">No comments yet.</li>}
                  {(commentsByReview[p.id] || []).map((c) => (
                    <li key={c.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">{c.user?.[0]}</div>
                      <div>
                        <div className="text-sm"><strong>{c.user}</strong> <span className="text-xs text-muted-foreground">· {c.time}</span></div>
                        <div className="text-sm text-muted-foreground mt-1">{c.text}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                {isAuth && (
                  <div className="mt-3 flex gap-2">
                    <input
                      aria-label="Write comment"
                      placeholder="Write a comment..."
                      className="flex-1 rounded-md border px-3 py-2 bg-input"
                      onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                          const val = (e.target as HTMLInputElement).value.trim();
                          if (!val) return;
                          (e.target as HTMLInputElement).value = "";
                          await postComment(p.id, val);
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={async () => {
                        // click handler posts using the first input found (simple)
                        const inp = document.querySelector<HTMLInputElement>(`input[aria-label="Write comment"]`);
                        if (!inp) return;
                        const val = inp.value.trim();
                        if (!val) return;
                        inp.value = "";
                        await postComment(p.id, val);
                      }}
                    >
                      Post
                    </Button>
                  </div>
                )}
              </div>
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