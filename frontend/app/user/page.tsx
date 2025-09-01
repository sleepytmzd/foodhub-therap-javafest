"use client";

import createApi from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { useEffect, useState } from "react";

interface UserResponse {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    coverPhoto: string;
    userPhoto: string;
    location: string;
    totalCriticScore: number;
    following: string[];
    followers: string[];
    visits: string[];
    criticScoreHistory: string[];
    locationRecommendations: string[];
}

export default function Home() {
    const { keycloak, initialized } = useAuth();
    const [user, setUser] = useState<UserResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<Partial<UserResponse>>({});
    const [userPhotoFile, setUserPhotoFile] = useState<File | null>(null);
    const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);

    

    const userId = keycloak?.tokenParsed?.sub as string;
    const api = createApi(process.env.NEXT_PUBLIC_USER_SERVICE_URL);
    const loadUserProfile = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/api/user/${userId}`);
            setUser(res.data);
            setForm(res.data);
            console.log("User profile loaded\n", res.data);
        } catch (err) {
            console.error("Failed to fetch user profile:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if(!userId) return;
        loadUserProfile();
    }, [userId])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleUpdate = async () => {
        if (!user) return;
        const formData = new FormData();

        const updatedUser = {
            ...user,
            ...form,
            id: userId,
        };
        formData.append("user", new Blob([JSON.stringify(updatedUser)], { type: "application/json" }));

        if (userPhotoFile) {
            formData.append("userPhoto", userPhotoFile);
        } else {
            // Send empty if not updating (backend handles fallback)
            formData.append("userPhoto", new Blob());
        }

        if (coverPhotoFile) {
            formData.append("coverPhoto", coverPhotoFile);
        } else {
            formData.append("coverPhoto", new Blob());
        }

        try {
            const res = await api.put(`/api/user/${userId}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            setUser(res.data);
            setEditing(false);
            alert("Profile updated successfully!");
        } catch (err) {
            console.error("Failed to update profile:", err);
            alert("Update failed");
        }
    };

    if (!keycloak?.authenticated) {
        return <p>You must log in to see your profile.</p>;
    }

    return (
        <div className="p-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">User Profile</h1>

            {!user && (
                <button
                    onClick={loadUserProfile}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? "Loading..." : "Load Profile"}
                </button>
            )}

            {user && !editing && (
                <div className="mt-6 space-y-4 border rounded-lg p-4 shadow">
                    <div className="flex items-center space-x-4">
                        {user.userPhoto && (
                            <img
                                src={user.userPhoto}
                                alt="User Photo"
                                className="w-20 h-20 rounded-full border"
                            />
                        )}
                        <div>
                            <h2 className="text-xl font-semibold">
                                {user.firstName} {user.lastName}
                            </h2>
                            <p className="text-gray-500">{user.email}</p>
                            <p className="text-sm text-gray-400">
                                @{user.name} · {user.location}
                            </p>
                        </div>
                    </div>

                    {user.coverPhoto && (
                        <div>
                            <img
                                src={user.coverPhoto}
                                alt="Cover Photo"
                                className="w-full h-40 object-cover rounded-lg"
                            />
                        </div>
                    )}

                    <button
                        onClick={() => setEditing(true)}
                        className="mt-4 px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                        Edit Profile
                    </button>
                </div>
            )}

            {user && editing && (
                <div className="mt-6 border rounded-lg p-4 shadow space-y-4">
                    <input
                        type="text"
                        name="firstName"
                        value={form.firstName || ""}
                        onChange={handleChange}
                        placeholder="First Name"
                        className="w-full border rounded p-2"
                    />
                    <input
                        type="text"
                        name="lastName"
                        value={form.lastName || ""}
                        onChange={handleChange}
                        placeholder="Last Name"
                        className="w-full border rounded p-2"
                    />
                    <input
                        type="text"
                        name="name"
                        value={form.name || ""}
                        onChange={handleChange}
                        placeholder="Username"
                        className="w-full border rounded p-2"
                    />
                    <input
                        type="text"
                        name="location"
                        value={form.location || ""}
                        onChange={handleChange}
                        placeholder="Location"
                        className="w-full border rounded p-2"
                    />

                    <div>
                        <label className="block text-sm">Update User Photo</label>
                        <input
                            type="file"
                            onChange={(e) =>
                                setUserPhotoFile(e.target.files ? e.target.files[0] : null)
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm">Update Cover Photo</label>
                        <input
                            type="file"
                            onChange={(e) =>
                                setCoverPhotoFile(e.target.files ? e.target.files[0] : null)
                            }
                        />
                    </div>

                    <div className="flex space-x-4">
                        <button
                            onClick={handleUpdate}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setEditing(false)}
                            className="px-4 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}