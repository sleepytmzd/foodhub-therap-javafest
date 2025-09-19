import createApi from "@/lib/api";

export type FoodRequest = {
  id: string | null;
  description?: string | null;
  f_name: string;
  category?: string | null;
  nutrition_table?: string | null;
  resturant_id?: string | null;
  image_url?: string | null;
  user_id?: string | null;
  price?: number | null;
};

export type FoodResponse = {
  id: string;
  description?: string | null;
  f_name: string;
  category?: string | null;
  nutrition_table?: string | null;
  resturant_id?: string | null;
  image_url?: string | null;
  user_id?: string | null;
  price?: number | null;
};

export function foodApiClient(baseUrl?: string, token?: string) {
  const api = createApi(baseUrl || process.env.NEXT_PUBLIC_FOOD_SERVICE_URL || "");
  if (token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${token}`;
  return api;
}

/* createFood supports optional image file (multipart) */
export async function createFood(payload: FoodRequest, baseUrl?: string, token?: string, imageFile?: File | null) {
  const api = foodApiClient(baseUrl, token);

  // build multipart/form-data
  const form = new FormData();
  // "food" part must be JSON; send as a Blob with application/json
  const jsonBlob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  form.append("food", jsonBlob);
  if (imageFile) {
    form.append("image", imageFile);
    console.log("image file appended");
    
  }

  // Do not set Content-Type header — axios/browser will set boundary automatically
  const resp = await (api as any).post("/api/food", form, {
    headers: {
      // ensure we don't override Content-Type
    },
  });
  return resp.data as FoodResponse;
}

export async function deleteFood(foodId: string, baseUrl?: string, token?: string) {
  const api = foodApiClient(baseUrl, token);
  await api.delete(`/api/food/${foodId}`);
}

export async function getFoodById(foodId: string, baseUrl?: string, token?: string) {
  const api = foodApiClient(baseUrl, token);
  const resp = await api.get<FoodResponse>(`/api/food/${foodId}`);
  return resp.data as FoodResponse;
}

export async function fetchFoods(baseUrl?: string, token?: string) {
  const api = foodApiClient(baseUrl, token);
  const resp = await api.get<FoodResponse[]>("/api/food");
  return resp.data as FoodResponse[];
}

// new: updateFood - updates food fields (used to set resturant_id after restaurant creation)
export async function updateFood(foodId: string, payload: Partial<FoodRequest>, baseUrl?: string, token?: string) {
  const api = foodApiClient(baseUrl, token);
  // send JSON body for updates (no image). If backend requires multipart, adjust later.
  const form = new FormData();
  const jsonBlob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  form.append("food", jsonBlob);
  const resp = await api.put<FoodResponse>(`/api/food/${foodId}`, form, {
    headers: {
      // ensure we don't override Content-Type
    },
  });
  return resp.data as FoodResponse;
}

