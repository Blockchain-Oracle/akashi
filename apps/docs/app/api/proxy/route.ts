import { openapi } from "@/lib/openapi";
import { site } from "@/lib/site";

// The playground calls the API through this route (the backend sends no CORS headers); only the docs may use it.
export const { GET, HEAD, PUT, POST, PATCH, DELETE } = openapi.createProxy({ allowedOrigins: [site.docs] });
