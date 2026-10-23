import { TreeWorkspace } from "@/components/tree/workspace";
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; nodeId: string }>;
}) {
  const { slug, nodeId } = await params;
  return <TreeWorkspace slug={slug} nodeId={nodeId} />;
}
