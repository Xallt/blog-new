import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const postSchema = z.object({
	title: z.string(),
	tags: z.array(z.string()).default([]),
	category: z.string(),
	/** Used for ordering; displayed as DD.MM.YYYY in the UI */
	pubDate: z.coerce.date(),
});

export type PostSchema = z.infer<typeof postSchema>;

const posts = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/posts" }),
	schema: postSchema,
});

export const collections = { posts };
