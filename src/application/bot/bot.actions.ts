"use server";

import { botService } from "./bot.service";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getBotConfigsAction() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  return await botService.getBotConfigs(user.id);
}

export async function updateBotConfigAction(accountId: string, data: {
  is_active?: boolean;
  trigger_labels?: string[];
  confidence_threshold?: number;
  auto_send?: boolean;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: "Unauthorized" };
  }

  // Verify account belongs to user (Prisma check is safer)
  const result = await botService.updateBotConfig(accountId, {
    is_active: data.is_active,
    trigger_labels: data.trigger_labels,
    confidence_threshold: data.confidence_threshold,
    auto_send: data.auto_send,
  });

  if (!result.error) {
    revalidatePath("/settings/bot");
  }

  return result;
}
