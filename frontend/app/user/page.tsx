"use client";

import { useAuth } from "@/providers/AuthProvider";
import createApi from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import UserReviewsFeed from "@/components/user/UserReviewsFeed";
import UsersListModal from "@/components/user/UsersListModal";
import RecentFoodsSidebar from "@/components/user/RecentFoodsSidebar";
import UserFoodsModal from "@/components/user/UserFoodsModal";
import { formatDistanceToNow } from "date-fns";
import HangoutsSidebar from "@/components/user/HangoutsSidebar";
import HangoutsModal from "@/components/user/HangoutsModal";
import { updateUser } from "@/lib/userService";
import { Coins, CoinsIcon, Glasses, GlassesIcon } from "lucide-react";

type User = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  coverPhoto?: string | null;
  userPhoto?: string | null;
  location?: string | null;
  totalCriticScore?: number;
  coins?: number;
  following?: string[];
  followers?: string[];
  visits?: string[];
  criticScoreHistory?: string[];
  locationRecommendations?: string[];
};

type ReviewMini = {
  id: string;
  title: string;
  description: string;
  rating?: number;
  createdAt?: string | null;
};

type VisitMini = {
  id: string;
  restaurantName: string;
  time: string;
  location?: string | null;
};

export default function UserProfilePage() {
  const { initialized, keycloak } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const token = (keycloak as any)?.token ?? undefined;

  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showAllFoodsModal, setShowAllFoodsModal] = useState(false);
  const [showHangoutsModal, setShowHangoutsModal] = useState(false);

  // replaced dummy arrays with real data fetched from backend
  const [reviews, setReviews] = useState<ReviewMini[]>([]);
  // const [visits, setVisits] = useState<VisitMini[]>([]);

  const fallbackCover =
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1600&q=80";
  const fallbackAvatar =
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80";

  useEffect(() => {
    const fetchData = async () => {
      if (!initialized) return;
      setLoading(true);
      try {
        const sub = (keycloak?.tokenParsed as any)?.sub ?? null;
        if (!sub) {
          setUser(null);
          setReviews([]);
          // setVisits([]);
          setLoading(false);
          return;
        }

        // fetch user profile (existing behavior)
        const userApi = createApi(process.env.NEXT_PUBLIC_USER_SERVICE_URL || "");
        if (keycloak?.token) (userApi as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
        let profileUser: User | null = null;
        try {
          const resp = await userApi.get(`/api/user/${sub}`);
          profileUser = resp.data as User;
          setUser(resp.data);
        } catch {
          const parsed = keycloak?.tokenParsed as any;
          if (parsed) {
            setUser({
              id: parsed.sub,
              name: parsed.name,
              firstName: parsed.given_name,
              lastName: parsed.family_name,
              email: parsed.email,
              coverPhoto: parsed.coverPhoto ?? null,
              userPhoto: parsed.userPhoto ?? null,
              location: parsed.location ?? null,
              totalCriticScore: parsed.totalCriticScore ?? 0,
              coins: parsed.coins ?? 0,
              following: parsed.following ?? [],
              followers: parsed.followers ?? [],
              visits: parsed.visits ?? [],
              criticScoreHistory: parsed.criticScoreHistory ?? [],
              locationRecommendations: parsed.locationRecommendations ?? [],
            });
          } else {
            setUser(null);
          }
        }

        // fetch reviews and filter by userId
        try {
          const reviewApi = createApi(process.env.NEXT_PUBLIC_REVIEW_SERVICE_URL || "");
          if (keycloak?.token) (reviewApi as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
          const rResp = await reviewApi.get(`/api/review/user/${sub}`);
          const userReviews = (rResp.data || []) as any[];
          const mapped = userReviews
            .map((r) => ({
              id: r.id,
              title: r.title,
              description: r.description,
              rating: undefined,
              createdAt: r.createdAt ? String(r.createdAt) : null,
            }))
            // sort newest first by createdAt if available
            .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
          setReviews(mapped);

          try {
             const followersCount = (profileUser?.followers?.length) ?? 0;
             const newScore = mapped.length + followersCount;
             // update only if different
             if (profileUser && (profileUser.totalCriticScore ?? 0) !== newScore) {
               // build updated payload based on the full profile so backend receives expected shape
               const updatedPayload = {
                 ...profileUser,
                 totalCriticScore: newScore,
               };
               // call updateUser helper which sends multipart/form-data expected by backend
               await updateUser(profileUser.id, updatedPayload, process.env.NEXT_PUBLIC_USER_SERVICE_URL, token);
               // reflect change on UI
               setUser((u) => u ? { ...u, totalCriticScore: newScore } : u);
             }
           } catch (e) {
             console.warn("failed to update critic score", e);
           }
        } catch (err) {
          console.error("failed to fetch reviews", err);
          setReviews([]);
        }

        // fetch visits and filter by userId
        // try {
        //   const visitApi = createApi(process.env.NEXT_PUBLIC_VISIT_SERVICE_URL || "");
        //   if (keycloak?.token) (visitApi as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
        //   const vResp = await visitApi.get("/api/visit");
        //   const allVisits = (vResp.data || []) as any[];
        //   const myVisits = allVisits
        //     .filter((v) => String(v.userId) === String(sub))
        //     .map((v) => ({
        //       id: v.id,
        //       restaurantName: v.resturantName ?? v.resturantName ?? "Unknown",
        //       time: v.time ?? "",
        //       location: v.location ?? null,
        //     }))
        //     .sort((a, b) => (b.time || "").localeCompare(a.time || ""));
        //   setVisits(myVisits);
        // } catch (err) {
        //   console.error("failed to fetch visits", err);
        //   setVisits([]);
        // }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, keycloak?.token]);

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* <div className="text-center text-muted-foreground">Loading profile…</div> */}
        <Skeleton className="h-screen" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">No profile available</h2>
          <p className="text-sm text-muted-foreground mt-2">
            You need to sign in to see your profile.
          </p>
          <div className="mt-4">
            <Link href="/" className="inline-block rounded px-4 py-2 bg-primary text-primary-foreground">
              Return home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const fullName = user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const followersCount = user.followers?.length ?? 0;
  const followingCount = user.following?.length ?? 0;
  // const visitsCount = visits.length;
  const score = user.totalCriticScore ?? 0;
  const coins = user.coins ?? 0;

  // only show the latest 3 on the sidebar
  const latestReviews = reviews.slice(0, 3);
  // const latestVisits = visits.slice(0, 3);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="rounded-lg overflow-hidden shadow">
        {/* Cover */}
        <div
          className="h-56 md:h-72 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${user.coverPhoto || fallbackCover})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/20" />
        </div>

        {/* Profile header */}
        <div className="bg-card p-6 md:p-8 -mt-12 md:-mt-16 rounded-lg shadow-lg relative z-10">
          <div className="flex items-start gap-6">
            <img
              src={user.userPhoto || fallbackAvatar}
              alt={fullName || "User avatar"}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-card"
            />

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold">{fullName || "Unnamed User"}</h1>
                <span className="text-sm text-muted-foreground">{user.email}</span>
                {user.location && <span className="ml-2 text-sm text-muted-foreground">· {user.location}</span>}
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                <GlassesIcon className="inline-block h-4 w-4" /> Critic score: <span className="font-medium">{score.toFixed(1)}</span>
                {" · "}
                <CoinsIcon className="inline-block h-4 w-4" /> Coins: <span className="font-medium">{coins}</span>
              </p>

              <div className="mt-4 flex items-center gap-6">
                <button onClick={() => setShowFollowersModal(true)} className="text-left">
                  <div>
                    <div className="text-lg font-semibold">{followersCount}</div>
                    <div className="text-xs text-muted-foreground hover:underline">Followers</div>
                  </div>
                </button>
                <button onClick={() => setShowFollowingModal(true)} className="text-left">
                  <div>
                    <div className="text-lg font-semibold">{followingCount}</div>
                    <div className="text-xs text-muted-foreground hover:underline">Following</div>
                  </div>
                </button>
                {/* <div>
                   <div className="text-lg font-semibold">{visitsCount}</div>
                   <div className="text-xs text-muted-foreground">Visits</div>
                 </div> */}
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="flex gap-2">
                <Link
                  href="/explore"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 bg-primary text-primary-foreground"
                >
                  Explore
                </Link>
                <Link
                  href="/user/edit"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 border bg-transparent text-sm"
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>

          {/* Main grid: left content + right sidebar */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left: wider content */}
            <div className="md:col-span-2 space-y-4">
              {/* <div className="rounded-md border p-4 bg-card-foreground/5">
                <h3 className="font-semibold">Recent activity</h3>

                <div className="mt-4">
                  <h4 className="text-sm font-medium">Location recommendations</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {user.locationRecommendations?.slice(0, 5).join(", ") || "No recommendations yet."}
                  </p>
                </div>
              </div> */}
              <UserReviewsFeed profileUserId={user.id} profileUserName={fullName} profileUserPhoto={user.userPhoto ?? null} />
            </div>

            {/* Right: sidebar with two horizontal subsections (stacked vertically) */}
            <aside className="space-y-4">
              {/* Top: Reviews mini view */}
              <div className="rounded-md border p-4 bg-card-foreground/5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Recent reviews</h3>
                  <Button size="sm" variant="ghost" onClick={() => setShowAllReviews(true)}>See all</Button>
                </div>

                <ul className="mt-3 space-y-3">
                  {latestReviews.length === 0 && <li className="text-sm text-muted-foreground">No reviews yet.</li>}
                  {latestReviews.map((r) => (
                    <li key={r.id} className="text-sm">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {r.description.length > 90 ? r.description.slice(0, 90) + "…" : r.description}
                      </div>
                      {r.createdAt && <div className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}</div>}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom: Recent foods */}
              <RecentFoodsSidebar userId={user.id} token={token} onOpenAll={() => setShowAllFoodsModal(true)} />
              {/* See all foods modal */}
              <UserFoodsModal open={showAllFoodsModal} onOpenChange={setShowAllFoodsModal} userId={user.id} token={token} />

              {/* Hangouts */}
              <HangoutsSidebar profileUserId={user.id} token={token} onOpenAll={() => setShowHangoutsModal(true)} />
              <HangoutsModal open={showHangoutsModal} onOpenChange={setShowHangoutsModal} profileUserId={user.id} token={token} />

              {/* Bottom: Recent visits */}
              {/* <div className="rounded-md border p-4 bg-card-foreground/5">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Recent visits</h3>
                  <div className="flex items-center gap-2">
                    <Link href="/visit/create">
                      <Button size="sm">Add visit</Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => setShowAllVisits(true)}>All</Button>
                  </div>
                </div>

                <ul className="mt-3 space-y-2">
                  {latestVisits.length === 0 && <li className="text-sm text-muted-foreground">No visits recorded.</li>}
                  {latestVisits.map((v) => (
                    <li key={v.id} className="text-sm flex justify-between">
                      <span className="font-medium">{v.restaurantName}</span>
                      <span className="text-xs text-muted-foreground">{v.time}</span>
                    </li>
                  ))}
                </ul>
              </div> */}
            </aside>
          </div>
        </div>
      </div>

      {/* reviews are shown inline in the left column via UserReviewsFeed */}
      {/* <AllVisitsModal open={showAllVisits} onOpenChange={setShowAllVisits} visits={visits} /> */}

      {/* Followers / Following modals */}
      <UsersListModal
        open={showFollowersModal}
        onOpenChange={setShowFollowersModal}
        userIds={user?.followers ?? []}
        title="Followers"
        token={token}
      />

      <UsersListModal
        open={showFollowingModal}
        onOpenChange={setShowFollowingModal}
        userIds={user?.following ?? []}
        title="Following"
        token={token}
      />
    </main>
  );
}