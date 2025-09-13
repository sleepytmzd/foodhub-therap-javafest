"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Home, Search, Star, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthButton from "@/components/AuthButton";
import { ModeToggle } from "@/components/ModeToggle";
import { useAuth } from "@/providers/AuthProvider";
import createApi from "@/lib/api";
import { fetchRestaurantsFromVisits } from "@/lib/visitService";

import FeedPost, { ReviewPost } from "@/components/explore/FeedPost";
import RestaurantCard, { Restaurant } from "@/components/explore/RestaurantCard";
import ExploreSidebar from "@/components/explore/ExploreSidebar";
import CreateReviewModal from "@/components/explore/CreateReviewModal";

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
  comments: string[] | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export default function ExplorePage() {
  const { initialized, keycloak } = useAuth();
  const isAuth = !!(initialized && keycloak && (keycloak as any).authenticated);
  const userId = (keycloak as any)?.tokenParsed?.sub ?? null;

  const [query, setQuery] = useState("");
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [rawReviews, setRawReviews] = useState<ReviewResponse[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [view, setView] = useState<"reviews" | "restaurants">("reviews");
  const [selectedReview, setSelectedReview] = useState<ReviewPost | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentsByReview, setCommentsByReview] = useState<Record<string, { id: string; user: string; text: string; time: string }[]>>({});

  const apiBase = process.env.NEXT_PUBLIC_REVIEW_SERVICE_URL || "";
  const userServiceBase = process.env.NEXT_PUBLIC_USER_SERVICE_URL || apiBase; // try user service or fallback
  const apiClient = () => {
    const api = createApi(apiBase);
    if (isAuth && keycloak?.token) {
      (api as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
    }
    return api;
  };

  const userApiClient = () => {
    const api = createApi(userServiceBase);
    if (isAuth && keycloak?.token) {
      (api as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
    }
    return api;
  };

  // fetch user names for a list of userIds (best-effort; returns map of fetched names)
  const fetchUserNames = async (userIds: string[]): Promise<Record<string, string>> => {
    if (!userServiceBase || userIds.length === 0) return {};
    const api = userApiClient();
    const newMap: Record<string, string> = {};
    await Promise.all(
      userIds.map(async (id) => {
        if (!id || userNames[id]) return;
        try {
          const resp = await api.get(`/api/user/${id}`);
          const data = resp.data;
          if (data && data.name) newMap[id] = data.name;
        } catch {
          // ignore failures
        }
      })
    );
    if (Object.keys(newMap).length) setUserNames((s) => ({ ...s, ...newMap }));
    return newMap;
  };

  // fetch reviews from backend and map to UI shape
  const fetchReviews = async () => {
    try {
      const api = apiClient();
      const resp = await api.get<ReviewResponse[]>("/api/review");
      const data = resp.data || [];
      setRawReviews(data);

      // gather userIds from reviews
      const ids = Array.from(new Set(data.map((d) => d.userId).filter(Boolean) as string[]));
      const fetchedNames = await fetchUserNames(ids);

      const mapped: ReviewPost[] = data.map((r) => {
        const username = userNames[r.userId ?? ""] ?? fetchedNames[r.userId ?? ""] ?? (r.userId ?? "User");
        // map comment ids (ReviewResponse.comments is list of comment ids) to placeholder comment objects
        const commentsArr = (r.comments ?? []).map((cid) => ({ id: cid, user: "", text: "", time: "" }));
        return {
          id: r.id,
          user: { id: r.userId ?? "unknown", name: username, avatar: undefined },
          title: r.title ?? "(no title)",
          description: r.description ?? "",
          rating: undefined,
          createdAt: r.createdAt ? String(r.createdAt) : "",
          comments: commentsArr,
        };
      });
      setPosts(mapped);

      // init liked map from reactionUsersLike if user authenticated
      if (userId) {
        const likesMap: Record<string, boolean> = {};
        data.forEach((r) => {
          const usersLike = r.reactionUsersLike ?? [];
          likesMap[r.id] = usersLike.includes(userId);
        });
        setLiked(likesMap);
      }
    } catch (e) {
      console.error("fetchReviews failed", e);
    }
  };

  // remove dummy list; use backend visits as restaurant source
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);

  // Fetch restaurants (visits) from backend
  const fetchRestaurants = async () => {
    try {
      const token = (keycloak as any)?.token;
      const data = await fetchRestaurantsFromVisits(process.env.NEXT_PUBLIC_VISIT_SERVICE_URL || "", token);
      setRestaurants(data);
    } catch (err) {
      console.error("fetchRestaurants failed", err);
    }
  };

  useEffect(() => {
    if (initialized) {
      fetchReviews();
      fetchRestaurants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.user.name.toLowerCase().includes(q)
    );
  }, [posts, query]);

  // Filter restaurants by query
  const filteredRestaurants = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return restaurants;
    return restaurants.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description?.toLowerCase().includes(q) ?? false) ||
        (r.tags?.some((tag) => tag.toLowerCase().includes(q)) ?? false)
    );
  }, [restaurants, query]);

  // toggle like by sending ReviewRequest via PUT /api/review/{id}
  const toggleLike = async (id: string) => {
    if (!isAuth) return alert("Please sign in to like");
    try {
      setLiked((s) => ({ ...s, [id]: !s[id] })); // optimistic
      const api = apiClient();
      const found = rawReviews.find((r) => r.id === id);
      if (!found) {
        await fetchReviews();
        return;
      }
      const usersLike = Array.from(found.reactionUsersLike ?? []);
      const already = usersLike.includes(userId);
      const updatedUsersLike = already ? usersLike.filter((u) => u !== userId) : [...usersLike, userId as string];

      const reviewRequest = {
        id: found.id,
        title: found.title,
        description: found.description,
        foodId: found.foodId,
        resturantId: found.resturantId,
        userId: found.userId,
        reactionCountLike: updatedUsersLike.length,
        reactionCountDislike: found.reactionCountDislike ?? 0,
        reactionUsersLike: updatedUsersLike,
        reactionUsersDislike: found.reactionUsersDislike ?? [],
        comments: found.comments ?? [],
        createdAt: found.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await api.put(`/api/review/${id}`, reviewRequest);
      await fetchReviews();
    } catch (e) {
      console.error("toggleLike failed", e);
      // rollback optimistic
      setLiked((s) => ({ ...s, [id]: !s[id] }));
    }
  };

  const openComments = async (post: ReviewPost) => {
    setSelectedReview(post);
    setShowReviewModal(true);
    try {
      const api = apiClient();
      const resp = await api.get(`/api/comment/review/${post.id}`);
      const commentsData = resp.data || [];
      // fetch names for commenters
      const commenterIds = Array.from(new Set(commentsData.map((c: any) => c.userId).filter(Boolean))) as string[];
      const fetchedNames = await fetchUserNames(commenterIds);

      const comments = (commentsData || []).map((c: any) => {
        const uname = userNames[c.userId] ?? fetchedNames[c.userId] ?? c.userId ?? "User";
        return {
          id: c.id,
          user: uname,
          text: c.content ?? "",
          time: c.createdAt ? String(c.createdAt) : "",
        };
      });

      setCommentsByReview((s) => ({ ...s, [post.id]: comments }));

      // keep post comment count in sync with fetched comments
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, comments: comments.map((c: { id: any; user: any; text: any; time: any; }) => ({ id: c.id, user: c.user, text: c.text, time: c.time })) } : p)));
    } catch (e) {
      console.error("fetch comments failed", e);
    }
  };

  const postComment = async (reviewId: string, content: string) => {
    if (!isAuth) {
      alert("Please sign in to comment");
      return;
    }
    try {
      const api = apiClient();
      const now = new Date().toISOString();
      const payload = {
        id: null,
        reviewId,
        userId,
        content,
        createdAt: now,
        updatedAt: now,
      };
      await api.post("/api/comment", payload);
      // refresh comments
      await openComments(posts.find((p) => p.id === reviewId)!);
    } catch (e) {
      console.error("postComment failed", e);
    }
  };

  // parent handles the actual POST (modal no longer posts)
  const handleCreate = async (newPost: { title: string; description: string; rating?: number }) => {
    if (!isAuth) {
      alert("Please sign in to create review");
      return;
    }
    try {
      const api = apiClient();
      const now = new Date().toISOString();
      const payload = {
        id: null,
        title: newPost.title,
        description: newPost.description,
        foodId: null,
        resturantId: null,
        userId,
        reactionCountLike: 0,
        reactionCountDislike: 0,
        reactionUsersLike: [],
        reactionUsersDislike: [],
        comments: [],
        createdAt: now,
        updatedAt: now,
      };
      await api.post("/api/review", payload);
      // refresh reviews once
      await fetchReviews();
      setShowCreateModal(false);
    } catch (e) {
      console.error("create review failed", e);
      alert("Failed to create review");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Top */}
        <header className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 rounded-lg border bg-card px-3 py-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input aria-label="Search" placeholder={view === "reviews" ? "Search reviews, users..." : "Search restaurants, tags..."} value={query} onChange={(e) => setQuery(e.target.value)} className="bg-transparent outline-none text-sm w-72" />
              {query && <button onClick={() => setQuery("")} className="text-xs text-muted-foreground px-2">Clear</button>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              {isAuth ? (
                <Button variant="default" onClick={() => setShowCreateModal(true)}><Plus className="w-4 h-4 mr-2" />Add review</Button>
              ) : (
                <AuthButton />
              )}
            </div>

            <ModeToggle />
            <div className="sm:hidden">{isAuth ? <Button size="sm" onClick={() => setShowCreateModal(true)}>Add</Button> : <AuthButton />}</div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <aside className="lg:col-span-3">
            <ExploreSidebar view={view} setView={setView} />
          </aside>

          <section className="lg:col-span-6 space-y-6">
            {view === "reviews" && (
              <>
                {filteredPosts.length === 0 && <div className="rounded border p-4 text-center text-muted-foreground">No posts found.</div>}
                {filteredPosts.map((post) => (
                  <FeedPost
                    key={post.id}
                    post={post}
                    liked={!!liked[post.id]}
                    isAuth={isAuth}
                    onToggleLike={(id) => toggleLike(id)}
                    onOpenComments={(p) => openComments(p)}
                    onRequireAuth={() => alert("Please sign in to perform this action.")}
                  />
                ))}
              </>
            )}

            {view === "restaurants" && (
              <>
                {filteredRestaurants.length === 0 && <div className="rounded border p-4 text-center text-muted-foreground">No restaurants found.</div>}
                <div className="space-y-4">
                  {filteredRestaurants.map((r) => (
                    <RestaurantCard key={r.id} r={r} onView={(rest) => { setSelectedRestaurant(rest); setShowRestaurantModal(true); }} />
                  ))}
                </div>
              </>
            )}
          </section>

          <aside className="lg:col-span-3">
            <div className="sticky top-24 space-y-4">
              <Card>
                <CardHeader><CardTitle>Bulletin</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    <li>New: AI recipe generator coming soon — try beta in AI Tools.</li>
                    <li>Tip: Verify your email to appear in local leaderboards.</li>
                    <li>Suggestion: Add trending dishes from your city (coming).</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle>Trending</CardTitle></CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="flex items-center justify-between text-sm"><span>Ramen spots</span><span className="text-xs text-muted-foreground">24 new</span></li>
                    <li className="flex items-center justify-between text-sm"><span>Street tacos</span><span className="text-xs text-muted-foreground">18 new</span></li>
                    <li className="flex items-center justify-between text-sm"><span>Plant-based desserts</span><span className="text-xs text-muted-foreground">9 new</span></li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </aside>
        </div>
      </div>

      {/* Review modal */}
      {showReviewModal && selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="max-w-3xl w-full bg-card rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 border-b flex items-start gap-3">
              <img src={selectedReview.user.avatar} alt={selectedReview.user.name} className="w-12 h-12 rounded-full object-cover" />
              <div className="flex-1">
                <div className="font-medium">{selectedReview.user.name}</div>
                <div className="text-xs text-muted-foreground">{selectedReview.createdAt}</div>
              </div>
              <button onClick={() => setShowReviewModal(false)} className="p-2"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">{selectedReview.title}</h2>
              <div className="text-sm text-muted-foreground whitespace-pre-line">{selectedReview.description}</div>

              <div className="pt-4 border-t">
                <h3 className="font-medium">Comments</h3>
                <ul className="mt-3 space-y-3">
                  {(commentsByReview[selectedReview.id] || []).length === 0 && <li className="text-sm text-muted-foreground">No comments yet.</li>}
                  {(commentsByReview[selectedReview.id] || []).map((c) => (
                    <li key={c.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">{c.user?.[0]}</div>
                      <div>
                        <div className="text-sm"><strong>{c.user}</strong> <span className="text-xs text-muted-foreground">· {c.time}</span></div>
                        <div className="text-sm text-muted-foreground mt-1">{c.text}</div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-4">
                  {isAuth ? (
                    <CommentInput onPost={async (text) => { await postComment(selectedReview.id, text); }} />
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <div>Sign in to post comments</div>
                      <AuthButton />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant modal */}
      {showRestaurantModal && selectedRestaurant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="max-w-3xl w-full bg-card rounded-lg shadow-lg overflow-hidden">
            <div className="relative">
              <div className="h-44 bg-cover bg-center" style={{ backgroundImage: `url(${selectedRestaurant.cover})` }} />
              <button onClick={() => setShowRestaurantModal(false)} className="absolute right-3 top-3 p-2 rounded bg-card/60"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedRestaurant.name}</h2>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <div className="inline-flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" /> {selectedRestaurant.rating.toFixed(1)}</div>
                    {selectedRestaurant.address && <div className="inline-flex items-center gap-1">{selectedRestaurant.address}</div>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">Bookmark</Button>
                  <Button size="sm">Directions</Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{selectedRestaurant.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium">Recent visits</h4>
                  <ul className="mt-2 text-sm text-muted-foreground space-y-2">
                    {(selectedRestaurant.recentVisits || []).map((v) => (
                      <li key={v.id} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{v.restaurantName}</div>
                          <div className="text-xs text-muted-foreground">{(v.foods || []).slice(0, 3).join(", ")}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{v.time}</div>
                      </li>
                    ))}
                    {(!selectedRestaurant.recentVisits || selectedRestaurant.recentVisits.length === 0) && <li className="text-sm text-muted-foreground">No recent visits recorded.</li>}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium">Tags</h4>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedRestaurant.tags || []).map((t) => (<span key={t} className="text-xs px-2 py-1 rounded border bg-muted/10">{t}</span>))}
                    {(selectedRestaurant.tags || []).length === 0 && <div className="text-sm text-muted-foreground">No tags.</div>}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex items-center justify-end gap-2">
                <Button onClick={() => setShowRestaurantModal(false)} variant="ghost">Close</Button>
                <a href={`/restaurants/${selectedRestaurant.id}`} className="inline-flex items-center px-4 py-2 rounded bg-primary text-primary-foreground">Open page</a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create review modal */}
      <CreateReviewModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={async (p) => await handleCreate(p)}
        user={isAuth ? { id: (keycloak as any)?.tokenParsed?.sub ?? "me", name: (keycloak as any)?.tokenParsed?.name ?? "You", avatar: undefined } : null}
      />
    </main>
  );
}

/* small comment input component - kept inline to avoid many files */
function CommentInput({ onPost }: { onPost: (text: string) => Promise<void> }) {
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  return (
    <div className="flex gap-2">
      <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a comment..." className="flex-1 rounded-md border px-3 py-2 bg-input" />
      <Button size="sm" onClick={async () => { if (!text.trim()) return; setPosting(true); await onPost(text.trim()); setText(""); setPosting(false); }}>
        {posting ? "Posting…" : "Post"}
      </Button>
    </div>
  );
}