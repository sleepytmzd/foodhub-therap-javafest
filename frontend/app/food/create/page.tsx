"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { createFood } from "@/lib/foodService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/*
Simple food creation page used when user wants to create a food during review flow.
On success stores created food object to localStorage key "createdFoodForReview" and navigates back.
*/

export default function CreateFoodPage() {
  const router = useRouter();
  const { initialized, keycloak } = useAuth();
  const token = (keycloak as any)?.token ?? undefined;
  const userId = (keycloak as any)?.tokenParsed?.sub ?? null;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) { setError("Name required"); return; }
    setSaving(true);
    try {
      const payload = {
        id: null,
        description: description.trim() || null,
        f_name: name.trim(),
        category: null,
        nutrition_table: null,
        resturant_id: null,
        image_url: null,
        user_id: userId ?? null,
      };
      const created = await createFood(payload, process.env.NEXT_PUBLIC_FOOD_SERVICE_URL, token, image ?? undefined);
      // store full created object so review modal can pick it up
      localStorage.setItem("createdFoodForReview", JSON.stringify(created));
      // return to previous page (modal will read localStorage)
      router.back();
    } catch (e) {
      console.error("create food failed", e);
      setError("Failed to create food");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">Create food</h1>
      <form onSubmit={submit} className="space-y-4 bg-card rounded p-6">
        {error && <div className="text-sm text-destructive">{error}</div>}
        <div>
          <label className="text-sm font-medium">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="text-sm font-medium">Image (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Create food"}</Button>
        </div>
      </form>
    </main>
  );
}