import { TreeWorkspace } from "@/components/tree/workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <TreeWorkspace slug={slug} />;
}
