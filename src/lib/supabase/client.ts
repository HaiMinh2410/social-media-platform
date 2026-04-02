import { createBrowserClient } from "@supabase/ssr";
import { env } from "../../infrastructure/config/env-registry";
import type { Database } from "../../domain/types/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
