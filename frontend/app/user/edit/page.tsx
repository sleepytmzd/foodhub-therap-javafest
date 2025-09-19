"use client";

import { useAuth } from "@/providers/AuthProvider";
import createApi from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

type User = {
  id: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  coverPhoto?: string | null;
  userPhoto?: string | null;
  location?: string | null;
  totalCriticScore?: number;
  coins?: number;
  following?: string[];
  followers?: string[];
  visits?: string[];
  criticScoreHistory?: string[];
  locationRecommendations?: string[];
};

export default function EditProfilePage() {
  const { initialized, keycloak } = useAuth();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fallbackCover =
    "https://images.unsplash.com/photo-1543353071-087092ec393f?auto=format&fit=crop&w=1600&q=80";
  const fallbackAvatar =
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80";

  // files and previews
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // no automatic geolocation; user will type location manually

  useEffect(() => {
    const load = async () => {
      if (!initialized) return;
      setLoading(true);
      try {
        const sub = (keycloak?.tokenParsed as any)?.sub ?? (keycloak?.subject as string) ?? null;
        if (!sub) {
          setUser(null);
          setLoading(false);
          return;
        }
        const api = createApi(process.env.NEXT_PUBLIC_USER_SERVICE_URL);
        if (keycloak?.token) {
          (api as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
        }
        const resp = await api.get(`/api/user/${sub}`);
        setUser(resp.data);
      } catch (e) {
        const parsed = keycloak?.tokenParsed as any;
        if (parsed) {
          setUser({
            id: parsed.sub,
            name: parsed.name,
            firstName: parsed.given_name,
            lastName: parsed.family_name,
            email: parsed.email,
            coverPhoto: parsed.coverPhoto ?? null,
            userPhoto: parsed.userPhoto ?? null,
            location: parsed.location ?? null,
            totalCriticScore: parsed.totalCriticScore ?? 0,
            coins: parsed.coins ?? 0,
            following: parsed.following ?? [],
            followers: parsed.followers ?? [],
            visits: parsed.visits ?? [],
            criticScoreHistory: parsed.criticScoreHistory ?? [],
            locationRecommendations: parsed.locationRecommendations ?? [],
          });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, keycloak?.authenticated]);

  // form state
  const [form, setForm] = useState({
    name: "",
    firstName: "",
    lastName: "",
    email: "",
    location: "",
    coverPhoto: "",
    userPhoto: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        location: user.location ?? "",
        coverPhoto: user.coverPhoto ?? "",
        userPhoto: user.userPhoto ?? "",
      });
      setAvatarPreview(user.userPhoto ?? null);
      setCoverPreview(user.coverPhoto ?? null);
    }
  }, [user]);

  const onChange = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((s) => ({ ...s, [k]: e.target.value }));
  };

  const onAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setAvatarFile(f);
    if (f) setAvatarPreview(URL.createObjectURL(f));
    else setAvatarPreview(user?.userPhoto ?? null);
  };

  const onCoverFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setCoverFile(f);
    if (f) setCoverPreview(URL.createObjectURL(f));
    else setCoverPreview(user?.coverPhoto ?? null);
  };

  const clearAvatarFile = () => {
    setAvatarFile(null);
    setAvatarPreview(user?.userPhoto ?? null);
  };
  const clearCoverFile = () => {
    setCoverFile(null);
    setCoverPreview(user?.coverPhoto ?? null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      if (!user) throw new Error("No user to update");
      const api = createApi(process.env.NEXT_PUBLIC_USER_SERVICE_URL);
      if (keycloak?.token) {
        (api as any).defaults.headers.common["Authorization"] = `Bearer ${keycloak.token}`;
      }

      const userPayload = {
        id: user.id,
        name: form.name,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        // keep current strings; backend will override with uploaded file urls if files provided
        coverPhoto: form.coverPhoto || null,
        userPhoto: form.userPhoto || null,
        location: form.location || null,
        totalCriticScore: user.totalCriticScore ?? 0,
        coins: user.coins ?? 0,
        following: user.following ?? [],
        followers: user.followers ?? [],
        visits: user.visits ?? [],
        criticScoreHistory: user.criticScoreHistory ?? [],
        locationRecommendations: user.locationRecommendations ?? [],
      };

      const fd = new FormData();
      fd.append("user", new Blob([JSON.stringify(userPayload)], { type: "application/json" }));
      // append files if provided (controller expects parts named 'userPhoto' and 'coverPhoto')
      if (avatarFile) fd.append("userPhoto", avatarFile, avatarFile.name);
      if (coverFile) fd.append("coverPhoto", coverFile, coverFile.name);

      // PUT to /api/user/{id} as multipart/form-data
      await api.put(`/api/user/${user.id}`, fd, {
        // let the browser set Content-Type including boundary
        headers: {},
      });

      // show toast notification instead of page text
      toast?.({ title: "Profile updated", description: "Profile updated successfully." });
      // refresh local state
      // if files were uploaded, server will return updated URLs on next fetch - do a quick refetch
      const refreshed = await api.get(`/api/user/${user.id}`);
      setUser(refreshed.data);
      setForm((s) => ({
        ...s,
        coverPhoto: refreshed.data.coverPhoto ?? s.coverPhoto,
        userPhoto: refreshed.data.userPhoto ?? s.userPhoto,
      }));
      // clear file inputs
      setAvatarFile(null);
      setCoverFile(null);
      setAvatarPreview(refreshed.data.userPhoto ?? null);
      setCoverPreview(refreshed.data.coverPhoto ?? null);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message ?? err?.message ?? "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center text-muted-foreground">Loading profile…</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-xl font-semibold">No profile available</h2>
          <p className="text-sm text-muted-foreground mt-2">Sign in to edit your profile.</p>
          <div className="mt-4 flex justify-center gap-3">
            <Link href="/" className="inline-block rounded px-4 py-2 bg-primary text-primary-foreground">
              Return home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <div className="rounded-lg overflow-hidden shadow-lg">
        {/* header gradient to differentiate from profile view */}
        <div className="h-28 bg-gradient-to-r from-slate-50 via-amber-50 to-rose-50" />

        <div className="bg-card p-6 md:p-8 -mt-12">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Preview column */}
            <aside className="w-full md:w-1/3 flex flex-col items-center">
              <div
                className="w-full h-36 rounded-md bg-cover bg-center mb-4 border"
                style={{ backgroundImage: `url(${coverPreview || fallbackCover})` }}
                aria-hidden
              />
              <div className="relative">
                <img
                  src={avatarPreview || fallbackAvatar}
                  alt="avatar preview"
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-card -mt-6"
                />
                {avatarFile && (
                  <button
                    type="button"
                    onClick={clearAvatarFile}
                    className="absolute -right-1 -top-1 bg-card px-2 py-1 rounded-full text-xs"
                    title="Remove selected avatar"
                  >
                    x
                  </button>
                )}
              </div>

              <div className="mt-4 text-center w-full px-2">
                <div className="text-lg font-semibold">{form.name || `${form.firstName} ${form.lastName}`.trim() || "Unnamed"}</div>
                <div className="text-sm text-muted-foreground truncate">{form.email}</div>
                <div className="mt-3 flex gap-2 justify-center">
                  <Link href="/user" className="inline-flex items-center px-3 py-1 rounded-md border hover:bg-accent hover:text-accent-foreground text-sm">
                    View profile
                  </Link>
                  {/* <Link href="/explore" className="inline-flex items-center px-3 py-1 rounded-md bg-primary text-primary-foreground text-sm">
                    Explore
                  </Link> */}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">Enter your location in the field below.</div>
              </div>

              {/* <div className="w-full mt-4 space-y-3">
                <label className="block text-sm font-medium">Upload avatar</label>
                <input type="file" accept="image/*" onChange={onAvatarFile} />
                <label className="block text-sm font-medium mt-2">Upload cover</label>
                <input type="file" accept="image/*" onChange={onCoverFile} />
                {coverFile && (
                  <div className="flex gap-2 mt-2">
                    <button type="button" onClick={clearCoverFile} className="px-3 py-1 rounded-md border text-sm">
                      Remove selected cover
                    </button>
                  </div>
                )}
              </div> */}
            </aside>

            {/* Form column */}
            <section className="w-full md:w-2/3">
              <h2 className="text-2xl font-semibold mb-2">Edit profile</h2>
              <p className="text-sm text-muted-foreground mb-4">Update your public profile information. You can upload new images or provide image URLs. Location is detected from your browser (you can edit it).</p>

              <form onSubmit={submit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Display name</label>
                    <input value={form.name} onChange={onChange("name")} className="mt-1 w-full rounded-md border px-3 py-2 bg-input text-foreground" />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Email (read-only)</label>
                    <input value={form.email} disabled className="mt-1 w-full rounded-md border px-3 py-2 bg-muted/10 text-foreground cursor-not-allowed" />
                  </div>

                  <div>
                    <label className="text-sm font-medium">First name</label>
                    <input value={form.firstName} onChange={onChange("firstName")} className="mt-1 w-full rounded-md border px-3 py-2 bg-input text-foreground" />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Last name</label>
                    <input value={form.lastName} onChange={onChange("lastName")} className="mt-1 w-full rounded-md border px-3 py-2 bg-input text-foreground" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Location</label>
                  <input value={form.location || ""} onChange={onChange("location")} className="mt-1 w-full rounded-md border px-3 py-2 bg-input text-foreground" placeholder="City, Country or lat, lng" />
                  <p className="text-xs text-muted-foreground mt-1">Detected coordinates will be stored as location. You can edit manually.</p>
                </div>

                <div className="w-full mt-4 space-y-3">
                    <label className="block text-sm font-medium">Upload avatar</label>
                    <input className="mt-1 border border-input rounded bg-muted/5 hover:bg-muted/10" type="file" accept="image/*" onChange={onAvatarFile} />
                    <label className="block text-sm font-medium mt-2">Upload cover</label>
                    <input className="mt-1 border border-input rounded bg-muted/5 hover:bg-muted/10" type="file" accept="image/*" onChange={onCoverFile} />
                    {coverFile && (
                    <div className="flex gap-2 mt-2">
                        <button type="button" onClick={clearCoverFile} className="px-3 py-1 rounded-md border text-sm">
                        Remove selected cover
                        </button>
                    </div>
                    )}
                </div>

                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Avatar URL</label>
                    <input value={form.userPhoto || ""} onChange={onChange("userPhoto")} className="mt-1 w-full rounded-md border px-3 py-2 bg-input text-foreground" placeholder="https://..." />
                    <p className="text-xs text-muted-foreground mt-1">Tip: paste a hosted image URL (ignored if you upload a file).</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Cover image URL</label>
                    <input value={form.coverPhoto || ""} onChange={onChange("coverPhoto")} className="mt-1 w-full rounded-md border px-3 py-2 bg-input text-foreground" placeholder="https://..." />
                    <p className="text-xs text-muted-foreground mt-1">Recommended size: wide image (≥1200px). Ignored if you upload a file.</p>
                  </div>
                </div> */}

                {errorMsg && <div className="text-sm text-destructive">{errorMsg}</div>}

                <div className="flex items-center gap-3">
                  <button type="submit" disabled={saving} className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground shadow-sm disabled:opacity-60">
                    {saving ? "Saving…" : "Save changes"}
                  </button>
                  <Link href="/user" className="inline-flex items-center px-3 py-2 rounded-md border hover:bg-accent hover:text-accent-foreground">
                    Cancel
                  </Link>
                </div>
              </form>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
