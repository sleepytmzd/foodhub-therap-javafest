"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { fetchUserById, followUser, unfollowUser } from "@/lib/userService";
import UserReviewsFeed from "@/components/user/UserReviewsFeed";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import createApi from "@/lib/api";
import Link from "next/link";
import React from "react";

export default function PublicUserProfilePage({ params }: { params: Promise<{ id: string }>  }) {
  const { id } = React.use(params);
  const userIdParam = id;
  const { initialized, keycloak } = useAuth();
  const token = (keycloak as any)?.token ?? undefined;
  const myId = (keycloak as any)?.tokenParsed?.sub ?? null;
  const isAuth = !!(initialized && keycloak && (keycloak as any).authenticated);

  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingFollow, setProcessingFollow] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const u = await fetchUserById(userIdParam, process.env.NEXT_PUBLIC_USER_SERVICE_URL, token);
        if (cancelled) return;
        setUser(u);
        // determine if current user follows this profile
        if (myId) {
          setIsFollowing((u.followers ?? []).includes(myId));
        } else {
          setIsFollowing(false);
        }
      } catch (e) {
        console.error("fetch public user failed", e);
        setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    if (initialized) load();
    return () => { cancelled = true; };
  }, [userIdParam, initialized, token, myId]);

  const handleFollow = async () => {
    if (!isAuth || !myId) return alert("Sign in to follow users");
    if (myId === userIdParam) return;
    setProcessingFollow(true);
    try {
      await followUser(myId, userIdParam, process.env.NEXT_PUBLIC_USER_SERVICE_URL, token);
      setIsFollowing(true);
      // refresh user followers count locally
      setUser((u: any) => ({ ...(u ?? {}), followers: Array.from(new Set([...(u?.followers ?? []), myId])) }));
    } catch (e) {
      console.error("follow failed", e);
      alert("Failed to follow user");
    } finally {
      setProcessingFollow(false);
    }
  };

  const handleUnfollow = async () => {
    if (!isAuth || !myId) return alert("Sign in to unfollow users");
    setProcessingFollow(true);
    try {
      await unfollowUser(myId, userIdParam, process.env.NEXT_PUBLIC_USER_SERVICE_URL, token);
      setIsFollowing(false);
      setUser((u: any) => ({ ...(u ?? {}), followers: (u?.followers ?? []).filter((id: string) => id !== myId) }));
    } catch (e) {
      console.error("unfollow failed", e);
      alert("Failed to unfollow user");
    } finally {
      setProcessingFollow(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* <div className="text-center text-muted-foreground">Loading profile…</div> */}
        <Skeleton className="h-screen" />
      </main>
    );
  }

  if (!user) {
    return <main className="max-w-5xl mx-auto px-4 py-12"><div className="rounded-lg border bg-card p-8 text-center">User not found.</div></main>;
  }

  const fullName = user.name ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const followersCount = (user.followers ?? []).length;
  const followingCount = (user.following ?? []).length;
  const score = user.totalCriticScore ?? 0;
  const fallbackCover = "https://images.unsplash.com/photo-1503264116251-35a269479413?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80";

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="rounded-lg overflow-hidden shadow">
        <div className="bg-card p-6 md:p-8 rounded-lg shadow-lg relative z-10">
          {/* Cover */}
          <div
            className="h-56 md:h-72 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${user.coverPhoto || fallbackCover})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/20" />
          </div>
          <div className="flex items-start gap-6 mt-10 md:mt-12">
            <img
              src={user.userPhoto || ""}
              alt={fullName || "User avatar"}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover ring-4 ring-card"
            />

            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-semibold">{fullName || "Unnamed User"}</h1>
                <p className="text-sm text-muted-foreground">Critic score: <span className="font-medium">{score.toFixed(1)}</span></p>
              </div>

              <div className="mt-4 flex items-center gap-6">
                <div>
                  <div className="text-lg font-semibold">{followersCount}</div>
                  <div className="text-xs text-muted-foreground">Followers</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{followingCount}</div>
                  <div className="text-xs text-muted-foreground">Following</div>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0">
              <div className="flex flex-col gap-2">
                <Link href="/explore" className="inline-flex items-center justify-center rounded-md px-4 py-2 border bg-transparent text-sm">Explore</Link>

                {isAuth && myId !== userIdParam && (
                  isFollowing ? (
                    <Button size="sm" variant="outline" onClick={handleUnfollow} disabled={processingFollow}>
                      {processingFollow ? "Working…" : "Unfollow"}
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleFollow} disabled={processingFollow}>
                      {processingFollow ? "Working…" : "Follow"}
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>

          {/* Main grid: left content + right sidebar */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-4">
              {/* show reviews feed for this user (same component used on private profile) */}
              <UserReviewsFeed profileUserId={user.id} profileUserName={fullName} />
            </div>

            <aside className="space-y-4">
              <div className="rounded-md border p-4 bg-card-foreground/5">
                <h3 className="font-semibold">About</h3>
                <p className="text-sm text-muted-foreground mt-2">{user.description ?? "No bio provided."}</p>
                {/* intentionally hide location, email, locationRecommendations */}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}