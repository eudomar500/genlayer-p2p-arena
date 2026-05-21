import { notFound } from "next/navigation";
import ProfileContent from "@/components/profile/ProfileContent";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const resolvedParams = await params;
  const address = resolvedParams.address;
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    notFound();
  }

  return (
    <div className="max-w-[1280px] mx-auto min-h-[calc(100vh-64px)]">
      <div className="max-w-4xl mx-auto py-12">
        <ProfileContent address={address} />
      </div>
    </div>
  );
}
