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