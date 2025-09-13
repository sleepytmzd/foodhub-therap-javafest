"use client";

import { useEffect, useState } from "react";
import createApi from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import VisitCard from "./VisitCard";
import CreateVisitModal from "./CreateVisitModal";

type VisitDto = {
  id: string;
  userId?: string;
  location?: string;
  time?: string;
  resturantName?: string;
  foods?: string[];
};

export default function VisitsSection() {
  const { initialized, keycloak } = useAuth();
  const [visits, setVisits] = useState<VisitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const userId = (keycloak as any)?.tokenParsed?.sub ?? null;
  const apiBase = process.env.NEXT_PUBLIC_VISIT_SERVICE_URL || "";

  const apiClient = () => {
    const api = createApi(apiBase);
    if (keycloak?.token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
    return api;
  };

  const fetchVisits = async () => {
    setLoading(true);
    try {
      const api = apiClient();
      const resp = await api.get<VisitDto[]>("/api/visit");
      const all = resp.data || [];
      const mine = all.filter((v) => String(v.userId) === String(userId));
      mine.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
      setVisits(mine);
    } catch (e) {
      console.error("fetchVisits", e);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized) fetchVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, keycloak?.token]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this visit?")) return;
    try {
      const api = apiClient();
      await api.delete(`/api/visit/${id}`);
      setVisits((s) => s.filter((v) => v.id !== id));
    } catch (err) {
      console.error("delete visit", err);
      alert("Delete failed. If backend lacks DELETE /api/visit/{id}, add it or tell me and I'll adapt.");
    }
  };

  const handleCreate = async (payload: { resturantName: string; location?: string; time?: string; foods?: string[] }) => {
    try {
      const api = apiClient();
      const now = payload.time ?? new Date().toISOString();
      const body = {
        id: null,
        userId,
        location: payload.location ?? null,
        time: now,
        resturantName: payload.resturantName,
        foods: payload.foods ?? [],
      };
      await api.post("/api/visit", body);
      await fetchVisits();
      setShowCreate(false);
    } catch (err) {
      console.error("create visit", err);
      alert("Create visit failed");
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading visits…</div>;
  if (visits.length === 0) return <div className="text-sm text-muted-foreground">You have no visits yet. Create one to get started.</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button className="text-sm underline" onClick={() => setShowCreate(true)}>Create visit</button>
      </div>

      {visits.map((v) => (
        <VisitCard key={v.id} visit={v} onDelete={() => handleDelete(v.id)} />
      ))}

      <CreateVisitModal open={showCreate} onOpenChange={setShowCreate} onCreate={handleCreate} />
    </div>
  );
}