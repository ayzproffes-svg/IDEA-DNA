import { z } from "zod";
export const nodeInput = z.object({
  tree_id: z.uuid(),
  parent_id: z.uuid().nullable(),
  title: z.string().trim().min(5).max(140),
  content: z.string().trim().min(20).max(10000),
  node_type: z.enum([
    "root",
    "extension",
    "improvement",
    "question",
    "constraint",
  ]),
  metadata: z
    .object({
      relation: z
        .enum(["extends", "improves", "challenges", "depends_on"])
        .optional(),
      tags: z.array(z.string().max(40)).max(10).optional(),
      links: z
        .array(z.url().refine((u) => /^https?:\/\//.test(u)))
        .max(5)
        .optional(),
    })
    .default({}),
});
export const treeInput = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(5).max(140),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(90),
  description: z.string().trim().min(20).max(500),
  content: z.string().trim().min(20).max(10000),
  visibility: z.enum(["public", "unlisted", "private"]),
  tags: z.array(z.string().trim().min(1).max(40)).max(10),
});
export const synthesisInput = z
  .object({
    tree_id: z.uuid(),
    source_node_a_id: z.uuid(),
    source_node_b_id: z.uuid(),
    intent: z.string().max(2000).default(""),
  })
  .refine(
    (v) => v.source_node_a_id !== v.source_node_b_id,
    "Choose two different contributions.",
  );
export const blueprintSchema = z.object({
  title: z.string().min(5).max(140),
  concept: z.string().min(20).max(3000),
  problem_statement: z.string().min(10).max(3000),
  proposed_mechanism: z.string().min(10).max(4000),
  key_components: z.array(z.string().max(700)).min(1).max(12),
  complementary_strengths: z.array(z.string().max(700)).min(1).max(8),
  conflicts_and_constraints: z.array(z.string().max(700)).min(1).max(8),
  risks_or_open_questions: z.array(z.string().max(700)).min(1).max(12),
  suggested_next_contribution: z.string().min(10).max(2000),
});
