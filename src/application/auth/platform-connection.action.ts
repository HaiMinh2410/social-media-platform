'use server';

import { disconnectAccount } from "@/infrastructure/database/repositories/platform-account.repository";
import { revalidatePath } from "next/cache";

export async function disconnectPlatformAccountAction(accountId: string) {
  try {
    const { success, error } = await disconnectAccount(accountId);
    
    if (!success) {
      return { error: error || 'Failed to disconnect account' };
    }
    
    revalidatePath('/settings/connections');
    return { success: true };
  } catch (error: any) {
    console.error('❌ [DISCONNECT_ACCOUNT_ACTION] Error:', error);
    return { error: error.message || 'An unexpected error occurred during disconnection' };
  }
}
