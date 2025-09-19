"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AuthButton from "@/components/AuthButton";
import { useAuth } from "@/providers/AuthProvider";
import createApi from "@/lib/api";
import { fetchRestaurants as fetchRestaurantsApi, getRestaurantById, RestaurantDto } from "@/lib/restaurantService";

import FeedPost, { ReviewPost } from "@/components/explore/FeedPost";
import AITools from "@/components/explore/AITools";
import { useSearchParams } from "next/navigation";
import { FoodResponse, getFoodById, fetchFoods as fetchFoodsApi } from "@/lib/foodService";
import CreateReviewModal from "@/components/explore/CreateReviewModal";
import ReviewDetailsModal from "@/components/explore/ReviewDetailsModal";
import UsersGrid from "@/components/explore/UsersGrid";
import ReviewsFilters, { ReviewsFilterState } from "@/components/explore/ReviewsFilters";
import RestaurantsFilters, { RestaurantsFilterState } from "@/components/explore/RestaurantsFilters";
import { format } from "date-fns";
import useToast from "@/components/ui/use-toast";
import FoodsGrid from "@/components/explore/FoodsGrid";

type ReviewResponse = {
  id: string;
  title: string;
  description: string;
  foodId: string | null;
  resturantId: string | null;
  userId: string | null;
  reactionCountLike: number;
  reactionCountDislike: number;
  reactionUsersLike?: string[] | null;
  reactionUsersDislike?: string[] | null;
  comments?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  sentiment?: "positive" | "neutral" | "negative" | null;
};

export default function ExplorePage() {
  const { initialized, keycloak } = useAuth();
  const isAuth = !!(initialized && keycloak && (keycloak as any).authenticated);
  const userId = (keycloak as any)?.tokenParsed?.sub ?? null;
  const searchParams = useSearchParams();
  // bulletin/sidebar state
  const [topRestaurants, setTopRestaurants] = useState<{ id: string; name?: string; location?: string; category?: string; reviewCount: number }[]>([]);
  const [topUsers, setTopUsers] = useState<{ id: string; name?: string; avatar?: string; totalCriticScore?: number }[]>([]);

  // derive view from query param set by Navbar
  const initialView = (searchParams.get("view") as "reviews" | "restaurants" | "users" | "ai" | "foods") || "reviews";
  const [view, setView] = useState<typeof initialView>(initialView);

  useEffect(() => {
    const sp = (searchParams.get("view") as "reviews" | "restaurants" | "users" | "ai") || "reviews";
    setView(sp);
  }, [searchParams]);

  // reviews/restaurants state
  const [posts, setPosts] = useState<ReviewPost[]>([]);
  const [rawReviews, setRawReviews] = useState<ReviewResponse[]>([]);
  const [userNames, setUserNames] = useState<Record<string, { name: string; avatar?: string }>>({});
  const [selectedReview, setSelectedReview] = useState<ReviewPost | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [restaurantDetails, setRestaurantDetails] = useState<{
    name: string;
    location: string;
    category: string;
    description: string;
    weblink?: string;
    foods: FoodResponse[];
  } | null>(null);
  const [showRestaurantModal, setShowRestaurantModal] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [commentsByReview, setCommentsByReview] = useState<Record<string, { id: string; user: string; avatar: string; text: string; time: string }[]>>({});
  const [restaurants, setRestaurants] = useState<RestaurantDto[]>([]);
  // foods for review filters
  const [foods, setFoods] = useState<FoodResponse[]>([]);
  const [foodQueryFilter, setFoodQueryFilter] = useState("");
  const [filteredFoodsForFilter, setFilteredFoodsForFilter] = useState<FoodResponse[]>([]);
  const [selectedFoodFilter, setSelectedFoodFilter] = useState<FoodResponse | null>(null);
  // modal food add UI state
  const [modalFoodQuery, setModalFoodQuery] = useState("");
  const [modalFilteredFoods, setModalFilteredFoods] = useState<FoodResponse[]>([]);
  const [modalSaving, setModalSaving] = useState(false);
  // removing state for individual food removes
  const [removingFoodIds, setRemovingFoodIds] = useState<Record<string, boolean>>({});
  // restaurant filter (search + select)
  const [restaurantQueryFilter, setRestaurantQueryFilter] = useState("");
  const [filteredRestaurantsForFilter, setFilteredRestaurantsForFilter] = useState<RestaurantDto[]>([]);
  const [selectedRestaurantFilter, setSelectedRestaurantFilter] = useState<RestaurantDto | null>(null);

  const [loading, setLoading] = useState(true);
  const {toast} = useToast();

  // new filter states
  const [reviewsFilters, setReviewsFilters] = useState<ReviewsFilterState>({
    title: "",
    description: "",
    username: "",
    sentiment: "",
  });
  const [reviewsSort, setReviewsSort] = useState<"newest" | "likes" | "comments">("newest");

  const [restaurantsFilters, setRestaurantsFilters] = useState<RestaurantsFilterState>({
    name: "",
    description: "",
    category: "",
    location: "",
  });

  const apiBase = process.env.NEXT_PUBLIC_REVIEW_SERVICE_URL || "";
  const userServiceBase = process.env.NEXT_PUBLIC_USER_SERVICE_URL || apiBase;
  const restaurantServiceBase = process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL || "";
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

  const restaurantApiClient = () => {
    const api = createApi(restaurantServiceBase);
    if (isAuth && keycloak?.token) {
      (api as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
    }
    return api;
  };

  const fetchUserNames = async (userIds: string[]): Promise<Record<string, { name: string; avatar?: string }>> => {
    if (!userServiceBase || userIds.length === 0) return {};
    const api = userApiClient();
    const newMap: Record<string, { name: string; avatar?: string }> = {};
    await Promise.all(
      userIds.map(async (id) => {
        if (!id || userNames[id]) return;
        try {
          const resp = await api.get(`/api/user/${id}`);
          const data = resp.data;
          if (data && data.name) newMap[id] = { name: data.name, avatar: data.userPhoto };
        } catch {
          // ignore
        }
      })
    );
    if (Object.keys(newMap).length) setUserNames((s) => ({ ...s, ...newMap }));
    return newMap;
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const api = apiClient();
      const resp = await api.get<ReviewResponse[]>("/api/review");
      const data = resp.data || [];
      setRawReviews(data);

      const ids = Array.from(new Set(data.map((d) => d.userId).filter(Boolean) as string[]));
      const fetchedNames = await fetchUserNames(ids);

      const mapped: ReviewPost[] = data.map((r) => {
        const username = userNames[r.userId ?? ""] ?? fetchedNames[r.userId ?? ""] ?? { name: r.userId ?? "User", avatar: undefined };
        const commentsArr = (r.comments ?? []).map((cid) => ({ id: cid, user: "", text: "", time: "" }));
        return {
          id: r.id,
          user: { id: r.userId ?? "unknown", name: username.name, avatar: username.avatar },
          title: r.title ?? "(no title)",
          description: r.description ?? "",
          rating: undefined,
          createdAt: r.createdAt ? String(r.createdAt) : "",
          comments: commentsArr,
          likes: r.reactionUsersLike ?? [],
          sentiment: r.sentiment ?? null,
          food: undefined,
          restaurant: undefined,
        } as ReviewPost;
      });

      await Promise.all(
        data.map(async (r, idx) => {
          try {
            if (r.foodId) {
              const f = await getFoodById(r.foodId, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, (keycloak as any)?.token);
              mapped[idx].food = f;
            } else if (r.resturantId) {
              const rest = await getRestaurantById(r.resturantId, process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL, (keycloak as any)?.token);
              mapped[idx].restaurant = { id: rest.id, name: rest.name, location: rest.location ?? undefined, category: rest.category ?? undefined, weblink: rest.weblink ?? undefined };
            }
          } catch {
            // ignore
          }
        })
      );

      setPosts(mapped);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const token = (keycloak as any)?.token;
      const data = await fetchRestaurantsApi(process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL || "", token);
      setRestaurants(data);
      // also set filtered list for filter UI
      setFilteredRestaurantsForFilter(data || []);
    } catch (err) {
      console.error("fetchRestaurants failed", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const token = (keycloak as any)?.token;
      const data = await fetchFoodsApi(process.env.NEXT_PUBLIC_FOOD_SERVICE_URL || "", token);
      setFoods(data || []);
      setFilteredFoodsForFilter(data || []);
    } catch (err) {
      console.error("fetchFoods failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized) {
      fetchReviews();
      fetchRestaurants();
      fetchFoods();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  // compute top restaurants by number of reviews (derived from rawReviews)
  useEffect(() => {
    if (!initialized || rawReviews.length === 0) {
      setTopRestaurants([]);
      return;
    }
    const cnt: Record<string, number> = {};
    rawReviews.forEach((r) => {
      const rid = r.resturantId;
      if (!rid) return;
      cnt[rid] = (cnt[rid] ?? 0) + 1;
    });
    const sorted = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 5); // take candidates
    (async () => {
      const list: { id: string; name?: string; location?: string; category?: string; reviewCount: number }[] = [];
      await Promise.all(
        sorted.map(async ([rid, count]) => {
          try {
            const rest = await getRestaurantById(rid, process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL, (keycloak as any)?.token);
            list.push({ id: rid, name: rest.name, location: rest.location ?? undefined, category: rest.category ?? undefined, reviewCount: count });
          } catch {
            // ignore missing restaurant but keep id/count
            list.push({ id: rid, reviewCount: count });
          }
        })
      );
      // sort by reviewCount again and take top 3
      list.sort((a, b) => b.reviewCount - a.reviewCount);
      setTopRestaurants(list.slice(0, 3));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawReviews, initialized, keycloak?.token]);

  // compute top users by backend totalCriticScore: pick candidate userIds from reviews then fetch user details
  useEffect(() => {
    if (!initialized) {
      setTopUsers([]);
      return;
    }
    const userCount: Record<string, number> = {};
    rawReviews.forEach((r) => {
      const uid = r.userId;
      if (!uid) return;
      userCount[uid] = (userCount[uid] ?? 0) + 1;
    });
    const candidateIds = Object.keys(userCount).sort((a, b) => (userCount[b] ?? 0) - (userCount[a] ?? 0)).slice(0, 10);
    if (candidateIds.length === 0) {
      setTopUsers([]);
      return;
    }
    (async () => {
      try {
        const api = createApi(process.env.NEXT_PUBLIC_USER_SERVICE_URL || "");
        if (isAuth && keycloak?.token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
        const fetched: { id: string; name?: string; avatar?: string; totalCriticScore?: number }[] = [];
        await Promise.all(
          candidateIds.map(async (uid) => {
            try {
              const resp = await api.get(`/api/user/${uid}`);
              const d = resp.data;
              fetched.push({ id: uid, name: d?.name ?? uid, avatar: d?.userPhoto, totalCriticScore: d?.totalCriticScore ?? 0 });
            } catch {
              // ignore missing user
            }
          })
        );
        fetched.sort((a, b) => (b.totalCriticScore ?? 0) - (a.totalCriticScore ?? 0));
        setTopUsers(fetched.slice(0, 3));
      } catch (e) {
        console.warn("failed to fetch top users", e);
        setTopUsers([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawReviews, initialized, keycloak?.token]);

  // filter/selection effects for the small search UIs
  useEffect(() => {
    if (!restaurantQueryFilter.trim()) {
      setFilteredRestaurantsForFilter(restaurants);
      return;
    }
    const q = restaurantQueryFilter.toLowerCase().trim();
    setFilteredRestaurantsForFilter(
      restaurants.filter((r) => (r.name ?? "").toLowerCase().includes(q) || (r.location ?? "").toLowerCase().includes(q) || (r.category ?? "").toLowerCase().includes(q))
    );
  }, [restaurantQueryFilter, restaurants]);

  useEffect(() => {
    if (!foodQueryFilter.trim()) {
      setFilteredFoodsForFilter(foods);
      return;
    }
    const q = foodQueryFilter.toLowerCase().trim();
    setFilteredFoodsForFilter(
      foods.filter((f) => (f.f_name ?? "").toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q))
    );
  }, [foodQueryFilter, foods]);

  // filtering logic uses dedicated filter states now
  // modal food query updates (local to modal, uses global foods list)
  useEffect(() => {
    if (!modalFoodQuery.trim()) {
      setModalFilteredFoods([]);
      return;
    }
    const q = modalFoodQuery.toLowerCase().trim();
    setModalFilteredFoods(foods.filter((f) => (f.f_name ?? "").toLowerCase().includes(q) || (f.description ?? "").toLowerCase().includes(q)).slice(0, 10));
  }, [modalFoodQuery, foods]);

  const filteredPosts = useMemo(() => {
    let arr = posts.slice();
    const f = reviewsFilters;
    if (f.title.trim()) {
      const s = f.title.trim().toLowerCase();
      arr = arr.filter((p) => p.title.toLowerCase().includes(s));
    }
    if (f.description.trim()) {
      const s = f.description.trim().toLowerCase();
      arr = arr.filter((p) => p.description.toLowerCase().includes(s));
    }
    if (f.username.trim()) {
      const s = f.username.trim().toLowerCase();
      arr = arr.filter((p) => (p.user?.name ?? "").toLowerCase().includes(s));
    }
    if (f.sentiment) {
      arr = arr.filter((p) => (p.sentiment ?? "").toLowerCase() === f.sentiment);
    }

    // apply restaurant filter (selectedRestaurantFilter)
    if (selectedRestaurantFilter) {
      arr = arr.filter((p) => (p.restaurant?.id ?? "") === selectedRestaurantFilter.id);
    }

    // apply food filter (selectedFoodFilter)
    if (selectedFoodFilter) {
      arr = arr.filter((p) => (p.food?.id ?? "") === selectedFoodFilter.id);
    }

    // sorting
    if (reviewsSort === "likes") {
      arr.sort((a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0));
    } else if (reviewsSort === "comments") {
      arr.sort((a, b) => (b.comments?.length ?? 0) - (a.comments?.length ?? 0));
    } else {
      arr.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return arr;
  }, [posts, reviewsFilters, reviewsSort, selectedRestaurantFilter, selectedFoodFilter]);

  const filteredRestaurants = useMemo(() => {
    let arr = restaurants.slice();
    const f = restaurantsFilters;
    if (f.name.trim()) {
      const s = f.name.trim().toLowerCase();
      arr = arr.filter((r) => (r.name ?? "").toLowerCase().includes(s));
    }
    if (f.description.trim()) {
      const s = f.description.trim().toLowerCase();
      arr = arr.filter((r) => (r.description ?? "").toLowerCase().includes(s));
    }
    if (f.category.trim()) {
      const s = f.category.trim().toLowerCase();
      arr = arr.filter((r) => (r.category ?? "").toLowerCase().includes(s));
    }
    if (f.location.trim()) {
      const s = f.location.trim().toLowerCase();
      arr = arr.filter((r) => (r.location ?? "").toLowerCase().includes(s));
    }
    return arr;
  }, [restaurants, restaurantsFilters]);

  const toggleLike = async (id: string) => {
    if (!isAuth) return alert("Please sign in to like");
    try {
      setLiked((s) => ({ ...s, [id]: !s[id] }));
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
        sentiment: found.sentiment ?? null,
      };

      await api.put(`/api/review/${id}`, reviewRequest);
      await fetchReviews();
    } catch (e) {
      console.error("toggleLike failed", e);
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
      const commenterIds = Array.from(new Set(commentsData.map((c: any) => c.userId).filter(Boolean))) as string[];
      const fetchedNames = await fetchUserNames(commenterIds);

      const comments = (commentsData || []).map((c: any) => {
        const uname = userNames[c.userId] ?? fetchedNames[c.userId] ?? { name: c.userId ?? "User", avatar: undefined };
        return {
          id: c.id,
          user: uname.name,
          avatar: uname.avatar,
          text: c.content ?? "",
          time: c.createdAt ? String(c.createdAt) : "",
        };
      });

      setCommentsByReview((s) => ({ ...s, [post.id]: comments }));

      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, comments: comments.map((c: any) => ({ id: c.id, user: c.user, text: c.text, time: c.time })) } : p)));
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
      await openComments(posts.find((p) => p.id === reviewId)!);
    } catch (e) {
      console.error("postComment failed", e);
    }
  };

  const handleCreate = async (newPost: { targetType: "food" | "restaurant" | "general"; targetId?: string | null | undefined; title: string; description: string; rating?: number }) => {
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
        foodId: newPost.targetType === "food" ? newPost.targetId ?? null : null,
        resturantId: newPost.targetType === "restaurant" ? newPost.targetId ?? null : null,
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
      await fetchReviews();
      setShowCreateModal(false);
    } catch (e) {
      console.error("create review failed", e);
      alert("Failed to create review");
    }
  };

  const handleViewRestaurant = async (restaurantId: string) => {
    setSelectedRestaurantId(restaurantId);
    setShowRestaurantModal(true);
    try {
      const rest = await getRestaurantById(restaurantId, process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL, (keycloak as any)?.token);
      const foodIds: string[] = rest.foodIdList ?? rest.foodIdList ?? [];
      const foods: FoodResponse[] = [];
      await Promise.all(
        (foodIds || []).map(async (fid) => {
          try {
            const f = await getFoodById(fid, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, (keycloak as any)?.token);
            foods.push(f);
          } catch {
            // ignore missing food
          }
        })
      );
      setRestaurantDetails({
        name: rest.name ?? "Unknown",
        location: rest.location ?? "Unknown location",
        category: rest.category ?? "Unknown category",
        description: rest.description ?? "No description",
        weblink: rest.weblink ?? undefined,
        foods,
      });
      // reset modal helper states
      setModalFoodQuery("");
      setModalFilteredFoods([]);
    } catch (e) {
      setRestaurantDetails(null);
    }
  };

  // remove a food from restaurant immediately (backend + UI)
  const removeFoodFromRestaurant = async (foodId: string) => {
    if (!selectedRestaurantId) return;
    // guard and optimistic lock
    setRemovingFoodIds((s) => ({ ...s, [foodId]: true }));
    try {
      const api = restaurantApiClient();
      // fetch latest restaurant to avoid clobbering concurrent changes
      const rest = await getRestaurantById(selectedRestaurantId, process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL, (keycloak as any)?.token);
      const currentFoodIds: string[] = rest.foodIdList ?? [];
      const updatedFoodIds = currentFoodIds.filter((id) => id !== foodId);

      const payload = { ...rest, foodIdList: updatedFoodIds };
      await api.put(`/api/restaurant/${selectedRestaurantId}`, payload);

      // update local modal UI
      setRestaurantDetails((prev) => {
        if (!prev) return prev;
        return { ...prev, foods: prev.foods.filter((ff) => ff.id !== foodId) };
      });

      // refresh lists
      await fetchRestaurants();
      toast?.({ title: "Removed", description: "Food removed from restaurant." });
    } catch (e) {
      console.error("removeFoodFromRestaurant failed", e);
      toast?.({ title: "Remove failed", description: "Could not remove food from restaurant.", variant: "destructive" });
    } finally {
      setRemovingFoodIds((s) => {
        const copy = { ...s };
        delete copy[foodId];
        return copy;
      });
    }
  };

  // --- HOOKS AND EFFECTS ABOVE RUN UNCONDITIONALLY (hook rules)
  // Protect the page UI: if auth provider initialized and user is NOT authenticated, show a sign-in prompt instead of the explore UI.
  if (initialized && !isAuth) {
    return (
      <main className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="max-w-xl w-full mx-4 rounded-md border bg-card p-6 text-center">
          <h2 className="text-lg font-semibold">Sign in required</h2>
          <p className="mt-2 text-sm text-muted-foreground">Please sign in to access Explore features.</p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <AuthButton />
            <Button variant="ghost" onClick={() => window.location.href = "/"}>Home</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Top - removed global search; filters shown inside each view */}
        <div>
          <header className="flex items-center justify-between gap-4 mb-6">
            <div />
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                {isAuth ? (
                  <Button className="hover:scale-105 transition-transform" variant="default" onClick={() => setShowCreateModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add review
                  </Button>
                ) : (
                  <AuthButton />
                )}
              </div>

              <div className="sm:hidden">{isAuth ? <Button size="sm" onClick={() => setShowCreateModal(true)}>Add</Button> : <AuthButton />}</div>
            </div>
          </header>

          {/* Central content only */}
          <section className="space-y-6">
            {view === "reviews" && (
              <>
                <ReviewsFilters filters={reviewsFilters} setFilters={setReviewsFilters} sort={reviewsSort} setSort={setReviewsSort} />

                {/* Additional filters: restaurant and food selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-sm font-medium">Filter by restaurant</label>
                    <input
                      className="w-full rounded border px-2 py-1 bg-input"
                      placeholder="Search restaurants..."
                      value={selectedRestaurantFilter ? selectedRestaurantFilter.name : restaurantQueryFilter}
                      onChange={(e) => {
                        setSelectedRestaurantFilter(null);
                        setRestaurantQueryFilter(e.target.value);
                      }}
                    />
                    {!selectedRestaurantFilter && restaurantQueryFilter.trim() !== "" && (
                      <div className="mt-2 max-h-48 overflow-auto border rounded bg-card p-2">
                        {filteredRestaurantsForFilter.slice(0, 10).map((r) => (
                          <div key={r.id} className="p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedRestaurantFilter(r); setRestaurantQueryFilter(r.name ?? ""); }}>
                            <div className="font-medium">{r.name}</div>
                            <div className="text-xs text-muted-foreground">{r.location} {r.category ? `· ${r.category}` : ""}</div>
                          </div>
                        ))}
                        {filteredRestaurantsForFilter.length === 0 && <div className="text-sm text-muted-foreground">No matches</div>}
                      </div>
                    )}
                    {selectedRestaurantFilter && (
                      <div className="mt-2 flex items-center justify-between gap-2 p-2 border rounded bg-muted/5">
                        <div>
                          <div className="font-medium">{selectedRestaurantFilter.name}</div>
                          <div className="text-xs text-muted-foreground">{selectedRestaurantFilter.location}</div>
                        </div>
                        <div>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedRestaurantFilter(null); setRestaurantQueryFilter(""); }}>Clear</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Filter by food</label>
                    <input
                      className="w-full rounded border px-2 py-1 bg-input"
                      placeholder="Search foods..."
                      value={selectedFoodFilter ? selectedFoodFilter.f_name : foodQueryFilter}
                      onChange={(e) => {
                        setSelectedFoodFilter(null);
                        setFoodQueryFilter(e.target.value);
                      }}
                    />
                    {!selectedFoodFilter && foodQueryFilter.trim() !== "" && (
                      <div className="mt-2 max-h-48 overflow-auto border rounded bg-card p-2">
                        {filteredFoodsForFilter.slice(0, 10).map((f) => (
                          <div key={f.id} className="p-2 rounded hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedFoodFilter(f); setFoodQueryFilter(f.f_name ?? ""); }}>
                            <div className="font-medium">{f.f_name}</div>
                            <div className="text-xs text-muted-foreground">{f.description}</div>
                          </div>
                        ))}
                        {filteredFoodsForFilter.length === 0 && <div className="text-sm text-muted-foreground">No matches</div>}
                      </div>
                    )}
                    {selectedFoodFilter && (
                      <div className="mt-2 flex items-center justify-between gap-2 p-2 border rounded bg-muted/5">
                        <div>
                          <div className="font-medium">{selectedFoodFilter.f_name}</div>
                          <div className="text-xs text-muted-foreground">{selectedFoodFilter.description}</div>
                        </div>
                        <div>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedFoodFilter(null); setFoodQueryFilter(""); }}>Clear</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {loading && (
                  <>
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                  </>
                )}

                {!loading && filteredPosts.length === 0 && <div className="rounded border p-4 text-center text-muted-foreground">No posts found.</div>}

                {!loading &&
                  filteredPosts.map((post) => (
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

            {showReviewModal && selectedReview && (
              <ReviewDetailsModal
                open={showReviewModal}
                onOpenChange={setShowReviewModal}
                post={selectedReview}
                comments={commentsByReview[selectedReview.id] ?? []}
                isAuth={isAuth}
                liked={!!liked[selectedReview.id]}
                onToggleLike={toggleLike}
                onPostComment={postComment}
                onRequireAuth={() => alert("Please sign in to comment")}
              />
            )}

            {view === "restaurants" && (
              <>
                <RestaurantsFilters filters={restaurantsFilters} setFilters={setRestaurantsFilters} />

                {loading && (
                  <>
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                    <Skeleton className="h-24 w-full rounded-md" />
                  </>
                )}

                {!loading && filteredRestaurants.length === 0 && (
                  <div className="rounded border p-4 text-center text-muted-foreground">No restaurants found.</div>
                )}

                <div className="space-y-4">
                  {!loading &&
                    filteredRestaurants.map((r) => (
                      <article key={r.id} className="rounded-md border bg-card p-4 overflow-hidden shadow-sm hover:scale-101 transition-transform hover:shadow-md">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold">{r.name}</div>
                            {r.location && <div className="text-xs text-muted-foreground mt-1">{r.location}</div>}
                            {r.category && <div className="text-xs text-muted-foreground mt-1">Category: {r.category}</div>}
                          </div>
                          <div className="mt-1">
                            <Button size="sm" onClick={() => handleViewRestaurant(r.id)}>View details</Button>
                          </div>
                        </div>
                      </article>
                    ))}
                </div>
              </>
            )}

            {view === "users" && (
              <>
                {/* users view contains its own search so we hide the global filters */}
                {!loading && <UsersGrid />}
              </>
            )}

            {view === "ai" && <AITools />}
            {view === "foods" && <FoodsGrid />}
          </section>
        </div>

        {/* Sidebar / bulletin */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-6 border-l p-6 bg-sidebar">
            <div className="rounded-md border bg-card p-4">
              <h4 className="font-semibold">Top reviewed restaurants</h4>
              <div className="mt-3 space-y-3">
                {topRestaurants.length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
                {topRestaurants.map((r) => (
                  <div key={r.id} className="p-2 rounded border bg-muted/5 border-sidebar-foreground/20 bg-sidebar">
                    <div className="font-medium">{r.name ?? r.id}</div>
                    <div className="text-xs text-muted-foreground">{r.location ?? "Unknown location"} {r.category ? `· ${r.category}` : ""}</div>
                    <div className="text-xs text-muted-foreground mt-1">Reviews: {r.reviewCount}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border bg-card p-4">
              <h4 className="font-semibold">Top critics</h4>
              <div className="mt-3 space-y-3">
                {topUsers.length === 0 && <div className="text-sm text-muted-foreground">No data</div>}
                {topUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded border bg-muted/5 border-sidebar-foreground/20 bg-sidebar">
                    {u.avatar ? (
                      <img src={u.avatar} alt={u.name} className="w-10 h-10 rounded object-cover border" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-xs">{(u.name ?? "U").charAt(0)}</div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{u.name}</div>
                      <div className="text-xs text-muted-foreground">Score: {u.totalCriticScore ?? 0}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Restaurant details modal (unchanged) */}
      {showRestaurantModal && restaurantDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true">
          <div className="max-w-3xl w-full bg-card rounded-lg shadow-lg overflow-hidden">
            <div className="p-6 space-y-4">
              <div>
                <h2 className="text-xl font-semibold">{restaurantDetails.name}</h2>
                <div className="text-sm text-muted-foreground mt-1">{restaurantDetails.location}</div>
                <div className="text-sm text-muted-foreground mt-1">{restaurantDetails.description}</div>
                <div className="text-sm text-muted-foreground mt-1">Category: {restaurantDetails.category}</div>
                {restaurantDetails.weblink && <div className="text-sm text-muted-foreground mt-1"><a href={restaurantDetails.weblink} target="_blank" rel="noopener noreferrer">Link</a></div>}
              </div>
              <div>
                <h3 className="font-medium mt-4 mb-2">Foods</h3>
                {restaurantDetails.foods.length === 0 && <div className="text-sm text-muted-foreground">No foods linked to this restaurant.</div>}
                <ul className="space-y-3">
                  {restaurantDetails.foods.map((f) => (
                    <li key={f.id} className="flex items-center gap-3">
                      {f.image_url ? (
                        <img src={f.image_url} alt={f.f_name} className="w-16 h-16 rounded object-cover border" />
                      ) : (
                        <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-xs">No image</div>
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{f.description}</div>
                        {f.description && <div className="text-sm text-muted-foreground">{f.f_name}</div>}
                      </div>
                      <div>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={!!removingFoodIds[f.id]}
                          onClick={() => removeFoodFromRestaurant(f.id)}
                        >
                          {removingFoodIds[f.id] ? "Removing…" : "Remove"}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              {/* Add foods UI */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Add foods to this restaurant</h4>
                <div className="flex gap-2">
                  <input
                    className="flex-1 rounded border px-2 py-1 bg-input"
                    placeholder="Search foods by name or description..."
                    value={modalFoodQuery}
                    onChange={(e) => setModalFoodQuery(e.target.value)}
                  />
                  <Button onClick={() => setModalFoodQuery("")} variant="ghost">Clear</Button>
                </div>
                {modalFilteredFoods.length > 0 && (
                  <div className="mt-2 max-h-44 overflow-auto border rounded bg-card p-2 space-y-2">
                    {modalFilteredFoods.map((mf) => {
                      const already = restaurantDetails.foods.some((ff) => ff.id === mf.id);
                      return (
                        <div key={mf.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                          <div>
                            <div className="font-medium">{mf.f_name}</div>
                            {mf.description && <div className="text-xs text-muted-foreground">{mf.description}</div>}
                          </div>
                          <div>
                            <Button size="sm" disabled={already} onClick={() => {
                              if (already) return;
                              setRestaurantDetails((prev) => {
                                if (!prev) return prev;
                                return { ...prev, foods: [...prev.foods, mf] };
                              });
                            }}>
                              {already ? "Added" : "Add"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="pt-4 border-t flex items-center justify-end gap-2">
                <Button variant="secondary" onClick={async () => {
                  setShowRestaurantModal(false);
                }}>Close</Button>
                <Button
                  onClick={async () => {
                    if (!selectedRestaurantId) return;
                    setModalSaving(true);
                    try {
                      // fetch latest restaurant, update foodIdList, PUT back
                      const api = restaurantApiClient();
                      const rest = await getRestaurantById(selectedRestaurantId, process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL, (keycloak as any)?.token);
                      const updatedFoodIds = Array.from(new Set([...(rest.foodIdList ?? []), ...(restaurantDetails.foods.map((ff) => ff.id ?? "").filter(Boolean))]));
                      const payload = { ...rest, foodIdList: updatedFoodIds };
                      // backend might expect /api/restaurant/:id
                      await api.put(`/api/restaurant/${selectedRestaurantId}`, payload);
                      toast?.({ title: "Updated", description: "Restaurant foods updated." });
                      // refresh local restaurants & modal data
                      await fetchRestaurants();
                      // re-load restaurant details to reflect backend canonical data
                      await handleViewRestaurant(selectedRestaurantId);
                    } catch (e) {
                      console.error("update restaurant foods failed", e);
                      toast?.({ title: "Update failed", description: "Could not update restaurant on backend.", variant: "destructive" });
                    } finally {
                      setModalSaving(false);
                    }
                  }}
                  disabled={modalSaving}
                >
                  {modalSaving ? "Saving…" : "Save foods"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create review modal */}
      <CreateReviewModal open={showCreateModal} onOpenChange={setShowCreateModal} onCreate={async (p) => await handleCreate(p)} />
    </main>
  );
}