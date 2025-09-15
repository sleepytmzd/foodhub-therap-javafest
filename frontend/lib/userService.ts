// "use client";

import createApi from "@/lib/api";

export type UserResponse = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  coverPhoto?: string | null;
  userPhoto?: string | null;
  location?: string | null;
  totalCriticScore?: number;
  following?: string[] | null;
  followers?: string[] | null;
  visits?: string[] | null;
  criticScoreHistory?: string[] | null;
  locationRecommendations?: string[] | null;
};

export type UserSummary = {
  id: string;
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  userPhoto?: string | null;
  location?: string | null;
  email?: string | null;
  followers?: string[] | null;
  following?: string[] | null;
  totalCriticScore?: number | null;
  visits?: string[] | null;
  // ...other fields...
};

export async function fetchUserById(userId: string, baseUrl?: string, token?: string) {
  const api = createApi(baseUrl || process.env.NEXT_PUBLIC_USER_SERVICE_URL || "");
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
  const resp = await api.get<UserResponse>(`/api/user/${userId}`);
  return resp.data as UserResponse;
}

// Add visitId to user's visits and send multipart/form-data to match backend update signature.
// The backend expects a "user" part (JSON) and file parts; we include empty blobs for userPhoto/coverPhoto.
export async function addVisitToUser(userId: string, visitId: string, baseUrl?: string, token?: string) {
  const api = createApi(baseUrl || process.env.NEXT_PUBLIC_USER_SERVICE_URL || "");
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;

  // fetch current user
  const resp = await api.get<UserResponse>(`/api/user/${userId}`);
  const user = resp.data as UserResponse;

  const updatedVisits = Array.from(new Set([...(user.visits ?? []), visitId]));

  // Build UserRequest shape in same field order as backend DTO/constructor
  const userRequest = {
    id: user.id,
    name: user.name ?? null,
    firstName: user.firstName ?? null,
    lastName: user.lastName ?? null,
    email: user.email ?? null,
    coverPhoto: user.coverPhoto ?? null,
    userPhoto: user.userPhoto ?? null,
    location: user.location ?? null,
    totalCriticScore: user.totalCriticScore ?? 0,
    following: user.following ?? [],
    followers: user.followers ?? [],
    visits: updatedVisits,
    criticScoreHistory: user.criticScoreHistory ?? [],
    locationRecommendations: user.locationRecommendations ?? [],
  };

  const form = new FormData();
  const jsonBlob = new Blob([JSON.stringify(userRequest)], { type: "application/json" });
  form.append("user", jsonBlob);
  // include empty files so controller's @RequestPart MultipartFile params are present but empty
  form.append("userPhoto", new Blob([]), "empty");
  form.append("coverPhoto", new Blob([]), "empty");

  // let axios/browser set Content-Type boundary
  await (api as any).put(`/api/user/${userId}`, form);
}

export async function fetchUsers(baseUrl?: string, token?: string) {
  const api = createApi(baseUrl || process.env.NEXT_PUBLIC_USER_SERVICE_URL || "");
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
  // try a simple list endpoint; backend may vary — adjust if your API differs
  try {
    const resp = await api.get<UserSummary[]>("/api/user");
    return resp.data || [];
  } catch (e) {
    // fallback: try /api/user/all
    try {
      const resp = await api.get<UserSummary[]>("/api/user/all");
      return resp.data || [];
    } catch {
      console.warn("fetchUsers: no /api/user list endpoint available");
      return [];
    }
  }
}

// Put user update using multipart form-data "user" part so it matches your backend controller signature
export async function updateUser(userId: string, userPayload: Partial<UserSummary>, baseUrl?: string, token?: string) {
  const api = createApi(baseUrl || process.env.NEXT_PUBLIC_USER_SERVICE_URL || "");
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;

  const form = new FormData();
  const blob = new Blob([JSON.stringify(userPayload)], { type: "application/json" });
  form.append("user", blob);
  // include empty file parts so controller @RequestPart MultipartFile params are present
  form.append("userPhoto", new Blob([]), "empty");
  form.append("coverPhoto", new Blob([]), "empty");

  const resp = await (api as any).put(`/api/user/${userId}`, form);
  return resp.data;
}

// Follow: add targetId to my following and add myId to target followers
export async function followUser(myId: string, targetId: string, baseUrl?: string, token?: string) {
  const apiBase = baseUrl || process.env.NEXT_PUBLIC_USER_SERVICE_URL || "";
  const api = createApi(apiBase);
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;

  // fetch both users
  const [mineResp, targetResp] = await Promise.all([
    api.get<UserSummary>(`/api/user/${myId}`),
    api.get<UserSummary>(`/api/user/${targetId}`),
  ]);
  const mine = mineResp.data;
  const target = targetResp.data;

  const updatedFollowing = Array.from(new Set([...(mine.following ?? []), targetId]));
  const updatedFollowers = Array.from(new Set([...(target.followers ?? []), myId]));

  // send updates in parallel; updateUser uses multipart signature
  await Promise.all([
    updateUser(myId, { ...mine, following: updatedFollowing }, apiBase, token),
    updateUser(targetId, { ...target, followers: updatedFollowers }, apiBase, token),
  ]);
}

// Unfollow helper
export async function unfollowUser(myId: string, targetId: string, baseUrl?: string, token?: string) {
  const apiBase = baseUrl || process.env.NEXT_PUBLIC_USER_SERVICE_URL || "";
  const api = createApi(apiBase);
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;

  const [mineResp, targetResp] = await Promise.all([
    api.get<UserSummary>(`/api/user/${myId}`),
    api.get<UserSummary>(`/api/user/${targetId}`),
  ]);
  const mine = mineResp.data;
  const target = targetResp.data;

  const updatedFollowing = (mine.following ?? []).filter((id) => id !== targetId);
  const updatedFollowers = (target.followers ?? []).filter((id) => id !== myId);

  await Promise.all([
    updateUser(myId, { ...mine, following: updatedFollowing }, apiBase, token),
    updateUser(targetId, { ...target, followers: updatedFollowers }, apiBase, token),
  ]);
}