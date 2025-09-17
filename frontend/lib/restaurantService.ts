"use client";

import createApi from "@/lib/api";

export type RestaurantDto = {
  id: string;
  name: string;
  location?: string | null;
  description?: string | null;
  category?: string | null;
  weblink?: string | null;
  foodIdList?: string[] | null;
};

export function restaurantApiClient(baseUrl?: string, token?: string) {
  const api = createApi(baseUrl || process.env.NEXT_PUBLIC_RESTAURANT_SERVICE_URL || "");
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
  return api;
}

export async function fetchRestaurants(baseUrl?: string, token?: string) {
  const api = restaurantApiClient(baseUrl, token);
  const resp = await api.get<RestaurantDto[]>("/api/restaurant");
  return resp.data || [];
}

export async function getRestaurantById(id: string, baseUrl?: string, token?: string) {
  const api = restaurantApiClient(baseUrl, token);
  const resp = await api.get<RestaurantDto>(`/api/restaurant/${id}`);
  return resp.data as RestaurantDto;
}

export type CreateRestaurantRequest = {
  id: string | null;
  name: string;
  location?: string | null;
  description?: string | null;
  category?: string | null;
  weblink?: string | null;
  foodIdList?: string[] | null;
};

export async function createRestaurant(payload: CreateRestaurantRequest, baseUrl?: string, token?: string) {
  const api = restaurantApiClient(baseUrl, token);
  const resp = await api.post<CreateRestaurantRequest>("/api/restaurant", payload);
  return resp.data as CreateRestaurantRequest & { id: string };
}

export async function updateRestaurant(id: string, payload: Partial<CreateRestaurantRequest>, baseUrl?: string, token?: string) {
  const api = restaurantApiClient(baseUrl, token);
  const resp = await api.put<CreateRestaurantRequest>(`/api/restaurant/${id}`, payload);
  return resp.data as CreateRestaurantRequest;
}