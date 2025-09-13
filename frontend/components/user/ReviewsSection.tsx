"use client";

import { useEffect, useState } from "react";
import createApi from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import ReviewCard from "./ReviewCard";
import EditReviewModal from "./EditReviewModal";

type ReviewDto = {
  id: string;
  title: string;
  description: string;
  foodId?: string | null;
  resturantId?: string | null;
  userId?: string | null;
  reactionCountLike?: number;
  reactionCountDislike?: number;
  reactionUsersLike?: string[] | null;
  reactionUsersDislike?: string[] | null;
  comments?: string[] | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export default function ReviewsSection() {
  const { initialized, keycloak } = useAuth();
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ReviewDto | null>(null);

  const userId = (keycloak as any)?.tokenParsed?.sub ?? null;
  const apiBase = process.env.NEXT_PUBLIC_REVIEW_SERVICE_URL || "";

  const apiClient = () => {
    const api = createApi(apiBase);
    if (keycloak?.token) (api as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
    return api;
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const api = apiClient();
      const resp = await api.get<ReviewDto[]>("/api/review");
      const all = resp.data || [];
      const mine = all.filter((r) => String(r.userId) === String(userId));
      // sort newest first by createdAt if present
      mine.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setReviews(mine);
    } catch (e) {
      console.error("fetchReviews", e);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized) fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, keycloak?.token]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      const api = apiClient();
      // try DELETE — if backend doesn't support, show message
      await api.delete(`/api/review/${id}`);
      setReviews((s) => s.filter((r) => r.id !== id));
    } catch (err: any) {
      console.error("delete review", err);
      alert("Delete failed. If your backend does not have DELETE /api/review/{id}, add it or tell me and I'll adapt the UI.");
    }
  };

  const handleEditSave = async (payload: { id: string; title: string; description: string }) => {
    try {
      const api = apiClient();
      const found = reviews.find((r) => r.id === payload.id);
      if (!found) return;
      const now = new Date().toISOString();
      const req = {
        id: found.id,
        title: payload.title,
        description: payload.description,
        foodId: found.foodId ?? null,
        resturantId: found.resturantId ?? null,
        userId: found.userId ?? null,
        reactionCountLike: found.reactionCountLike ?? 0,
        reactionCountDislike: found.reactionCountDislike ?? 0,
        reactionUsersLike: found.reactionUsersLike ?? [],
        reactionUsersDislike: found.reactionUsersDislike ?? [],
        comments: found.comments ?? [],
        createdAt: found.createdAt ?? now,
        updatedAt: now,
      };
      await api.put(`/api/review/${found.id}`, req);
      await fetchReviews();
      setEditing(null);
    } catch (err) {
      console.error("edit save", err);
      alert("Update failed");
    }
  };

  if (loading) return <div className="text-sm text-muted-foreground">Loading reviews…</div>;
  if (reviews.length === 0) return <div className="text-sm text-muted-foreground">You have no reviews yet.</div>;

  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} onEdit={() => setEditing(r)} onDelete={() => handleDelete(r.id)} />
      ))}

      {editing && (
        <EditReviewModal
          open={!!editing}
          review={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => handleEditSave(data)}
        />
      )}
    </div>
  );
}