import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ base: "./content/articles", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    status: z.literal("approved"),
    byline: z.string().min(1),
    sourceRecords: z.array(z.string().min(1)).min(1),
    approvalRecord: z.string().min(1),
    mediaRightsRecords: z.array(z.string().min(1)).default([]),
    corrections: z.array(z.string().min(1)).default([])
  })
});

export const collections = { articles };
