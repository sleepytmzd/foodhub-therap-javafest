// import axios from "axios";
// import keycloak from "./keycloak";

// // Create an Axios instance
// const api = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_VISIT_SERVICE_URL, // your Spring Boot backend
// });

// // Add interceptor to inject token before each request
// api.interceptors.request.use(async (config) => {
//   try {
//     // Refresh token if it's expiring soon
//     await keycloak.updateToken(30);
//     config.headers = {
//       ...config.headers,
//       Authorization: `Bearer ${keycloak.token}`,
//     };
//   } catch (err) {
//     console.warn("Token refresh failed, logging out");
//     keycloak.logout();
//   }
//   return config;
// });

// export default api;

import axios, { AxiosHeaders } from "axios";
import keycloak from "./keycloak";

// Function to create an Axios instance with optional baseURL
const createApi = (baseURL = process.env.NEXT_PUBLIC_VISIT_SERVICE_URL) => {
  const api = axios.create({
    baseURL,
  });

  // Add interceptor to inject token before each request
  api.interceptors.request.use(async (config) => {
    try {
      // Refresh token if it's expiring soon
      await keycloak.updateToken(30);
      // config.headers = {
      //   ...config.headers,
      //   Authorization: `Bearer ${keycloak.token}`,
      // };
      config.headers = new AxiosHeaders({
        ...config.headers,
        Authorization: `Bearer ${keycloak.token}`,
      })
    } catch (err) {
      console.warn("Token refresh failed, logging out");
      keycloak.logout();
    }
    return config;
  });

  return api;
};

export default createApi;
