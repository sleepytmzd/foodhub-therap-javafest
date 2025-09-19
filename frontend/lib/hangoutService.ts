import createApi from "@/lib/api";

export type HangoutResponse = {
  id: string;
  message?: string | null;
  userId1?: string | null;
  userId2?: string | null;
  restaurantId?: string | null;
  approvedByUser1?: boolean | null;
  approvedByUser2?: boolean | null;
  allocatedTime?: string | null;
  foodIds?: string[] | null;
};

export type HangoutRequest = {
  message?: string | null;
  userId1?: string | null;
  userId2?: string | null;
  restaurantId?: string | null;
  approvedByUser1?: boolean | null;
  approvedByUser2?: boolean | null;
  allocatedTime?: string | null;
  foodIds?: string[] | null;
};

export function hangoutClient(base?: string, token?: string) {
  const api = createApi(base || (process.env.NEXT_PUBLIC_HANGOUT_SERVICE_URL || ""));
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
  return api;
}

export async function getAllHangouts(base?: string, token?: string) {
  const api = hangoutClient(base, token);
  const resp = await api.get<HangoutResponse[]>("/api/hangout");
  return resp.data || [];
}

export async function createHangout(body: HangoutRequest, base?: string, token?: string) {
  const api = hangoutClient(base, token);
  const resp = await api.post<HangoutResponse>("/api/hangout", body);
  return resp.data;
}

export async function updateHangout(id: string, body: HangoutRequest, base?: string, token?: string) {
  const api = hangoutClient(base, token);
  const resp = await api.put<HangoutResponse>(`/api/hangout/${id}`, body);
  return resp.data;
}

export async function getHangoutById(id: string, base?: string, token?: string) {
  const api = hangoutClient(base, token);
  const resp = await api.get<HangoutResponse>(`/api/hangout/${id}`);
  return resp.data;
}