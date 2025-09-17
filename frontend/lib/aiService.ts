"use client";

import createApi from "@/lib/api";

export type AIResponse = {
  query: string;
  recommended_restaurants: { name: string; category?: string; location?: string }[];
  recommended_foods: { name: string; category?: string; restaurant?: string; price?: number }[];
  nearby_restaurants: { name: string; category?: string; location?: string }[];
};

export async function getRecommendations(
  queryText: string,
  opts?: { types?: string; max_price?: number; restaurant?: string; category?: string; place?: string },
  baseUrl?: string
): Promise<AIResponse> {
  const base = baseUrl || process.env.NEXT_PUBLIC_RECOMM_AGENT_URL || "http://localhost:8020";
  const api = createApi(base);
  // backend expects POST with query params per current FastAPI signature
  const resp = await (api as any).post(
    `/get-recommendation`,
    null,
    {
      params: {
        query_text: queryText,
        types: opts?.types,
        max_price: opts?.max_price,
        restaurant: opts?.restaurant,
        category: opts?.category,
        place: opts?.place,
      },
    }
  );
  return resp.data as AIResponse;
}