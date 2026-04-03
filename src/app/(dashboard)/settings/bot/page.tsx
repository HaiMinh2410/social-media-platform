import { getBotConfigsAction } from "@/application/bot/bot.actions";
import { BotConfigForm } from "./bot-config-form";

export const metadata = {
  title: "Bot Settings - Antigravity",
  description: "Configure AI Bot responses for your social media accounts.",
};

export default async function BotSettingsPage() {
  const { data: accounts, error } = await getBotConfigsAction();

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h1 className="text-xl font-semibold text-red-500">Error</h1>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 animate-in fade-in duration-500">
      <div className="mb-8 ">
        <h1 className="text-3xl font-bold tracking-tight">Bot Configuration</h1>
        <p className="text-muted-foreground mt-2">
          Manage AI automations and response rules for each connected account.
        </p>
      </div>

      <div className="space-y-8">
        {accounts?.map((account) => (
          <BotConfigForm 
            key={account.id} 
            account={account} 
          />
        ))}

        {!accounts || accounts.length === 0 && (
          <div className="text-center p-12 bg-gray-50/50 rounded-2xl border border-dashed">
            <p className="text-muted-foreground">
              No platform accounts connected. Connect an account in the dashboard to enable the bot.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
