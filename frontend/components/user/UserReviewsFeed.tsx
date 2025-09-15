"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import createApi from "@/lib/api";
import FeedPost, { ReviewPost } from "@/components/explore/FeedPost";
import { Button } from "@/components/ui/button";
import { Skeleton } from "../ui/skeleton";

type ReviewResponse = {
  id: string;
  title?: string;
  description?: string;
  foodId?: string | null;
  resturantId?: string | null;
  userId?: string | null;
  reactionCountLike?: number;
  reactionCountDislike?: number;
  reactionUsersLike?: string[] | null;
  reactionUsersDislike?: string[] | null;
  comments?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export default function UserReviewsFeed({
  profileUserId,
  profileUserName,
}: {
  profileUserId: string;
  profileUserName?: string | null;
}) {
  const { initialized, keycloak } = useAuth();
  const isAuth = !!(initialized && keycloak && (keycloak as any).authenticated);
  const token = (keycloak as any)?.token ?? undefined;

  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [rawMap, setRawMap] = useState<Record<string, ReviewResponse>>({});
  const [commentsByReview, setCommentsByReview] = useState<Record<string, { id: string; user: string; text: string; time: string }[]>>({});
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const reviewApi = () => {
    const api = createApi(process.env.NEXT_PUBLIC_REVIEW_SERVICE_URL || "");
    if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return api;
  };
  const userApi = () => {
    const api = createApi(process.env.NEXT_PUBLIC_USER_SERVICE_URL || "");
    if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return api;
  };

  useEffect(() => {
    if (!profileUserId) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const api = reviewApi();
        const resp = await api.get<ReviewResponse[]>(`/api/review/user/${profileUserId}`);
        const mine = resp.data || [];
        const raw: Record<string, ReviewResponse> = {};
        mine.forEach((r) => (raw[r.id] = r));
        if (cancelled) return;
        setRawMap(raw);

        const mapped: ReviewPost[] = mine.map((r) => ({
          id: r.id,
          user: { id: r.userId ?? "unknown", name: profileUserName ?? (r.userId ?? "User"), avatar: undefined },
          title: r.title ?? "(no title)",
          description: r.description ?? "",
          rating: undefined,
          createdAt: r.createdAt ? String(r.createdAt) : "",
          comments: [], // filled below
          likes: r.reactionUsersLike ?? [],
        }));
        setPosts(mapped);

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
              const commenterIds = Array.from(new Set(commentsData.map((c: any) => c.userId).filter(Boolean)));
              const nameMap: Record<string, string> = {};
              await Promise.all(
                (commenterIds as string[]).map(async (uid: string) => {
                  try {
                    const uResp = await userApi().get(`/api/user/${uid}`);
                    const d = uResp.data;
                    if (d && (d as any).name) nameMap[uid] = (d as any).name;
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
              // ignore
            }
          })
        );
      } catch (e) {
        console.error("Failed to load user reviews", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUserId, initialized]);

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
      // refresh raw map for that review
      const refreshed = await reviewApi().get<ReviewResponse>(`/api/review/${id}`);
      setRawMap((m) => ({ ...m, [id]: refreshed.data }));
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
      const commenterIds = Array.from(new Set(commentsData.map((c: any) => c.userId).filter(Boolean)));
      const nameMap: Record<string, string> = {};
      await Promise.all(
        (commenterIds as string[]).map(async (uid: string) => {
          try {
            const uResp = await userApi().get(`/api/user/${uid}`);
            const d = uResp.data;
            if (d && (d as any).name) nameMap[uid] = (d as any).name;
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

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      await reviewApi().delete(`/api/review/${id}`);
      setPosts((s) => s.filter((p) => p.id !== id));
      setRawMap((m) => { const nm = { ...m }; delete nm[id]; return nm; });
      setCommentsByReview((c) => { const nc = { ...c }; delete nc[id]; return nc; });
    } catch (e) {
      console.error("delete review failed", e);
      alert("Failed to delete review");
    }
  };

  return (
    <section className="space-y-4">
      <div className="rounded-md border p-4 bg-card-foreground/5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Reviews</h3>
          {/* optional controls could go here */}
        </div>
      </div>

      <div className="space-y-6">
        {loading && (
          // <div className="text-sm text-muted-foreground">Loading reviews…</div>
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        )}
        {!loading && posts.length === 0 && <div className="text-sm text-muted-foreground">No reviews yet.</div>}

        {posts
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((p) => (
          <div key={p.id} className="rounded border p-3 space-y-2 bg-card shadow-sm hover:shadow-md transition-shadow duration-150 ease-in-out">
            <div className="flex justify-end mb-2 space-x-2">
              {isAuth && (keycloak as any)?.tokenParsed?.sub === p.user.id &&
              (<Button size="sm" variant="destructive" onClick={() => handleDeleteReview(p.id)}>Delete</Button>)}
            </div>

            <FeedPost
              post={{
                ...p,
                comments: commentsByReview[p.id] ?? [],
              }}
              liked={!!liked[p.id]}
              isAuth={isAuth}
              onToggleLike={() => toggleLike(p.id)}
              onOpenComments={() => { /* comments displayed below already */ }}
              onRequireAuth={() => alert("Please sign in to perform this action.")}
            />

            {/* Inline comments */}
            <div className="mt-3 border-t pt-3 space-y-2">
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
                    aria-label={`Write comment for ${p.id}`}
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
                      const inp = document.querySelector<HTMLInputElement>(`input[aria-label="Write comment for ${p.id}"]`);
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
    </section>
  );
}