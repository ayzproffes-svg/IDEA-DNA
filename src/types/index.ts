export type Kind =
  | "root"
  | "extension"
  | "improvement"
  | "question"
  | "constraint"
  | "synthesis";
export type Idea = {
  change_reason?: string;
  id: string;
  tree_id: string;
  parent_id: string | null;
  author_id: string;
  title: string;
  content: string;
  node_type: Kind;
  status: "draft" | "published" | "archived";
  contribution_score: number;
  metadata: Record<string, unknown>;
  created_at: string;
};
export type Tree = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  creator_id: string;
  visibility: "public" | "unlisted" | "private";
  created_at: string;
};
export type Person = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
};
