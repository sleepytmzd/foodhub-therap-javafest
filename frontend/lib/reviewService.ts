import createApi from "./api";

export function reviewApiClient(baseUrl?: string, token?: string) {
  const api = createApi(baseUrl || process.env.NEXT_PUBLIC_REVIEW_SERVICE_URL || "");
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
  return api;
}

export async function deleteReview(reviewId: string, baseUrl?: string, token?: string) {
  const api = reviewApiClient(baseUrl, token);
  await api.delete(`/api/review/${reviewId}`);
}