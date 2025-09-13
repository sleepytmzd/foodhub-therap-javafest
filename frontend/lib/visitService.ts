import createApi from "@/lib/api";

export type VisitDto = {
  id: string;
  userId?: string;
  location?: string;
  time?: string;
  resturantName?: string;
  foods?: string[];
};

// Convert visits into a simple restaurant model used by the UI.
// baseUrl should point to the visit service (NEXT_PUBLIC_VISIT_SERVICE_URL).
export async function fetchRestaurantsFromVisits(baseUrl: string, token?: string) {
  const apiBase = baseUrl || process.env.NEXT_PUBLIC_VISIT_SERVICE_URL || "";
  const api = createApi(apiBase);
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;

  const resp = await api.get<VisitDto[]>("/api/visit");
  const visits: VisitDto[] = resp.data || [];

  // Group visits by restaurant name
  const byName: Record<string, VisitDto[]> = {};
  for (const v of visits) {
    const name = (v.resturantName || "Unknown").trim();
    if (!byName[name]) byName[name] = [];
    byName[name].push(v);
  }

  // Map to Restaurant-like objects for the UI
  const restaurants = Object.entries(byName).map(([name, arr]) => {
    const sample = arr[0];
    return {
      id: sample.id ?? name, // use first visit id or name as fallback
      name,
      description: `${arr.length} recent visit${arr.length > 1 ? "s" : ""}`,
      rating: 4.6, // static default rating (adjust if you have real ratings)
      address: sample.location ?? undefined,
      cover: "/images/restaurant-placeholder.jpg", // fallback cover; change if you have images
      tags: [],
      recentVisits: arr.map((v) => ({
        id: v.id,
        restaurantName: v.resturantName ?? name,
        time: v.time ?? "",
        foods: v.foods ?? [],
      })),
    };
  });

  return restaurants;
}

export type VisitRequest = {
  id: string | null;
  userId: string | null;
  location: string | null;
  time: string; // ISO
  resturantName: string;
  foods: string[] | null;
};

export type VisitResponse = {
  id: string;
  userId?: string | null;
  location?: string | null;
  time?: string | null;
  resturantName?: string | null;
  foods?: string[] | null;
};

export function visitApiClient(baseUrl?: string, token?: string) {
  const api = createApi(baseUrl || process.env.NEXT_PUBLIC_VISIT_SERVICE_URL || "");
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
  return api;
}

export async function createVisit(payload: VisitRequest, baseUrl?: string, token?: string) {
  const api = visitApiClient(baseUrl, token);
  const resp = await api.post<VisitResponse>("/api/visit", payload);
  return resp.data as VisitResponse;
}

export async function updateVisit(visitId: string, payload: VisitRequest, baseUrl?: string, token?: string) {
  const api = visitApiClient(baseUrl, token);
  const resp = await api.put<VisitResponse>(`/api/visit/${visitId}`, payload);
  return resp.data as VisitResponse;
}

// new: delete a visit by id
export async function deleteVisit(visitId: string, baseUrl?: string, token?: string) {
  const api = visitApiClient(baseUrl, token);
  await api.delete(`/api/visit/${visitId}`);
}

export async function getVisitById(visitId: string, baseUrl?: string, token?: string) {
  const api = visitApiClient(baseUrl, token);
  const resp = await api.get<VisitResponse>(`/api/visit/${visitId}`);
  return resp.data as VisitResponse;
}