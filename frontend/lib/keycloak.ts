import Keycloak from "keycloak-js";

const keycloak = new Keycloak({
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL  ?? "http://localhost:9000",
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM ?? "foodhub",
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID ?? "foodhub-kc",
});

export default keycloak;
