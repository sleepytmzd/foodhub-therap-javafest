#!/bin/sh
set -e

# Replace placeholders in Next.js static files with runtime env vars
replace_placeholder() {
  find /app/.next/static -type f -exec sed -i "s|$1|$2|g" {} +
}

replace_placeholder "__KEYCLOAK_URL__" "${NEXT_PUBLIC_KEYCLOAK_URL}"
replace_placeholder "__KEYCLOAK_REALM__" "${NEXT_PUBLIC_KEYCLOAK_REALM}"
replace_placeholder "__KEYCLOAK_CLIENT_ID__" "${NEXT_PUBLIC_KEYCLOAK_CLIENT_ID}"
replace_placeholder "__USER_SERVICE_URL__" "${NEXT_PUBLIC_USER_SERVICE_URL}"
replace_placeholder "__FOOD_SERVICE_URL__" "${NEXT_PUBLIC_FOOD_SERVICE_URL}"
replace_placeholder "__REVIEW_SERVICE_URL__" "${NEXT_PUBLIC_REVIEW_SERVICE_URL}"
replace_placeholder "__RESTAURANT_SERVICE_URL__" "${NEXT_PUBLIC_RESTAURANT_SERVICE_URL}"
replace_placeholder "__HANGOUT_SERVICE_URL__" "${NEXT_PUBLIC_HANGOUT_SERVICE_URL}"
replace_placeholder "__RECOMM_AGENT_URL__" "${NEXT_PUBLIC_RECOMM_AGENT_URL}"
replace_placeholder "__NUTRITION_AGENT_URL__" "${NEXT_PUBLIC_NUTRITION_AGENT_URL}"

exec "$@"
