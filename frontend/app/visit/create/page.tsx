"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import createApi from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function CreateVisitPage() {
  const router = useRouter();
  const { initialized, keycloak } = useAuth();
  const isAuth = !!(initialized && keycloak && (keycloak as any).authenticated);
  const userId = (keycloak as any)?.tokenParsed?.sub ?? null;

  const [resturantName, setResturantName] = useState("");
  const [location, setLocation] = useState("");
  const [time, setTime] = useState(""); // datetime-local string
  const [foods, setFoods] = useState(""); // comma separated
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuth) {
      setError("Please sign in to add a visit.");
      return;
    }
    if (!resturantName.trim()) {
      setError("Restaurant name is required.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const api = createApi(process.env.NEXT_PUBLIC_VISIT_SERVICE_URL || "");
      if (keycloak?.token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;

      const parsedFoods = foods
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const isoTime = time ? new Date(time).toISOString() : new Date().toISOString();

      const payload = {
        id: null,
        userId,
        location: location || null,
        time: isoTime,
        resturantName: resturantName,
        foods: parsedFoods,
      };

      await api.post("/api/visit", payload);

      // navigate back to profile (refresh there will show the new visit)
      router.push("/user");
    } catch (err) {
      console.error("create visit failed", err);
      setError("Failed to create visit. See console.");
      setSaving(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-4">Add visit</h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-card rounded p-6">
        {error && <div className="text-sm text-destructive">{error}</div>}

        <div>
          <label className="text-sm font-medium">Restaurant name</label>
          <Input value={resturantName} onChange={(e) => setResturantName(e.target.value)} placeholder="e.g., Green Fork" />
        </div>

        <div>
          <label className="text-sm font-medium">Location</label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Address or area" />
        </div>

        <div>
          <label className="text-sm font-medium">Visited at</label>
          <input
            type="datetime-local"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2 bg-input"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Foods (comma separated)</label>
          <Textarea value={foods} onChange={(e) => setFoods(e.target.value)} placeholder="e.g., Carbonara, Tiramisu" />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={() => router.push("/user")}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add visit"}</Button>
        </div>
      </form>
    </main>
  );
}