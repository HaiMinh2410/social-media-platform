import { createClient } from "@supabase/supabase-js";
import { env } from "../../infrastructure/config/env-registry";
import type { Database } from "../../domain/types/database.types";

/**
 * Supabase Admin Client - Cảnh báo: Chỉ dùng cho Server-side!
 * Có toàn quyền bypass RLS. Không bao giờ được dùng ở Client Components.
 */
export function createAdminClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
