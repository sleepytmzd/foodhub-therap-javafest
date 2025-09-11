"use client";
import { useAuth } from "@/providers/AuthProvider";
import { Button } from "./ui/button";

export default function AuthButton() {
  const { initialized, keycloak } = useAuth();

  if (!initialized) {
    return (
      <div className="h-8 flex items-center">
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!keycloak?.authenticated) {
    return (
      <Button size="sm" onClick={() => keycloak?.login()}>
        Sign in
      </Button>
    );
  }

  // show compact name + sign out action when authenticated
  const name =
    (keycloak.tokenParsed as any)?.name ||
    (keycloak.tokenParsed as any)?.preferred_username ||
    (keycloak.tokenParsed as any)?.given_name ||
    "User";

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:flex items-center px-3 py-1 rounded-md bg-muted/10 text-sm">
        <span className="font-medium">{name}</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => keycloak.logout({ redirectUri: window.location.origin })}
      >
        Sign out
      </Button>
    </div>
  );
}
