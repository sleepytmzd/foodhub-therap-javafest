"use client";
import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import keycloak from "@/lib/keycloak";

type AuthContextType = {
  initialized: boolean;
  keycloak: typeof keycloak | null;
  token?: string;
};

const AuthContext = createContext<AuthContextType>({ initialized: false, keycloak: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    keycloak
      .init({
        onLoad: "check-sso", 
        pkceMethod: "S256",
        checkLoginIframe: false,
        silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
      })
      .then(() => {
        // Add automatic token refresh loop
        setInitialized(true);

        setInterval(() => {
          keycloak.updateToken(60).catch(() => {
            console.warn("Failed to refresh token, logging out");
            keycloak.logout();
          });
        }, 600000); // check every 10mins if token is close to expiring
      })
      .catch((err) => {
        console.error("Keycloak init error", err);
        setInitialized(true);
      });
  }, []);

  // console.log(keycloak);
  

  return <AuthContext.Provider value={{ initialized, keycloak, token: keycloak.token }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
