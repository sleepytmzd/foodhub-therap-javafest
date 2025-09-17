import createApi from "@/lib/api";

export type NutritionResponse = {
  food_description: string;
  carbohydrates: string;
  proteins: string;
  fats: string;
  total_calories: string;
};

export async function getNutritionFromImageUrl(imageUrl: string, baseUrl?: string) {
  const base = baseUrl || process.env.NEXT_PUBLIC_NUTRITION_AGENT_URL || "http://localhost:8022";
  const api = createApi(base);
  const resp = await api.post<NutritionResponse>("/analyze-nutrition-url", { image_url: imageUrl });
  return resp.data as NutritionResponse;
}