"use client";

import { createOpenAPIPage } from "fumadocs-openapi/ui";

// Types and examples only: trying Akashi lives in the Akashi app, not in the reference.
export const OpenAPIPage = createOpenAPIPage({ playground: { enabled: false } });
