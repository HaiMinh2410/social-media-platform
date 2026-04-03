import { db } from "@/lib/db";
import { BotConfiguration } from "@/domain/types/database";

export class BotService {
  /**
   * Fetch all bot configurations for active platform accounts belonging to the profile.
   */
  async getBotConfigs(profileId: string) {
    try {
      const accounts = await db.platformAccount.findMany({
        where: { profileId },
        include: {
          botConfiguration: true,
        },
      });

      return { data: accounts, error: null };
    } catch (error) {
      console.error("[BotService.getBotConfigs] Error:", error);
      return { data: null, error: "Failed to fetch bot configurations" };
    }
  }

  /**
   * Update or create a bot configuration for a specific account.
   */
  async updateBotConfig(accountId: string, data: Partial<BotConfiguration>) {
    try {
      const config = await db.botConfiguration.upsert({
        where: { accountId },
        create: {
          accountId,
          isActive: data.is_active ?? false,
          triggerLabels: data.trigger_labels ?? [],
          confidenceThreshold: data.confidence_threshold ?? 0.75,
          autoSend: data.auto_send ?? false,
        },
        update: {
          isActive: data.is_active,
          triggerLabels: data.trigger_labels,
          confidenceThreshold: data.confidence_threshold,
          autoSend: data.auto_send,
        },
      });

      return { data: config, error: null };
    } catch (error) {
      console.error("[BotService.updateBotConfig] Error:", error);
      return { data: null, error: "Failed to update bot configuration" };
    }
  }
}

export const botService = new BotService();
