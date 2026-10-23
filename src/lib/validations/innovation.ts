import { z } from "zod";
export const relationType = z.enum([
  "improves",
  "depends_on",
  "combines_with",
  "inspired_by",
  "supports",
  "challenges",
  "conflicts_with",
]);
export const entryInput = z
  .object({
    tree_id: z.uuid(),
    node_id: z.uuid(),
    target_id: z.uuid().nullable().optional(),
    kind: z.enum([
      "relationship",
      "evidence",
      "assumption",
      "risk",
      "question", "contribution",
    ]),
    body: z.string().trim().min(5).max(12000),
    relation: relationType.nullable().optional(),
    source_url: z
      .url()
      .refine((u) => /^https?:\/\//.test(u))
      .nullable()
      .optional(),
  })
  .refine((v) => v.target_id !== v.node_id, "Choose distinct nodes")
  .refine(
    (v) => v.kind !== "relationship" || Boolean(v.target_id && v.relation),
    "A relationship needs a target and type",
  );
export const reviewInput = z.object({
  id: z.uuid(),
  body: z.string().trim().min(5).max(12000),
  relation: relationType.nullable(),
  status: z.enum(["accepted", "rejected", "resolved"]),
});
