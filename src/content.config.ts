import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const policies = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/policies" }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    last_updated: z.string().min(1),
    effective_date: z.string().min(1).optional(),
    index: z.boolean(),
    route: z.string().regex(/^\/[a-z0-9-]+\/$/)
  })
});

export const collections = { policies };
