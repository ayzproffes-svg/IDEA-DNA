import { Profile } from "@/components/profile";
export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  return <Profile username={(await params).username} />;
}
