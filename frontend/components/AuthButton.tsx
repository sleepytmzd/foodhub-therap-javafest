"use client";
import { useAuth } from "@/providers/AuthProvider";

export default function AuthButton() {
  const { initialized, keycloak } = useAuth();

  if (!initialized) return <div>Loading auth...</div>;

  if (!keycloak?.authenticated) {
    return <button className="p-8" onClick={() => keycloak?.login()}>Sign in</button>;
  }
  return (
    <button
      className="p-8"
      onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
    >
      Sign out
    </button>
  );
}
