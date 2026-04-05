import { getPlatformAccountDetail } from "@/infrastructure/database/repositories/platform-account.repository";
import { AccountDetailClient } from "@/components/settings/account-detail-client";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { data: account } = await getPlatformAccountDetail(params.id);
  
  return {
    title: account ? `${account.platform_user_name} - Platform Status` : "Account Details",
    description: `Detailed sync status and activity logs for ${account?.platform_user_name || 'your account'}.`,
  };
}

export default async function AccountDetailPage({ params }: PageProps) {
  const { data: account, error } = await getPlatformAccountDetail(params.id);

  if (error || !account) {
    notFound();
  }

  return (
    <div className="p-4 sm:p-8 min-h-screen bg-slate-50/20">
      <AccountDetailClient account={account} />
    </div>
  );
}
