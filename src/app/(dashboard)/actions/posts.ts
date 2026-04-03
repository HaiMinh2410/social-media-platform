"use server";

import { createClient } from "@/lib/supabase/server";
import { PostService } from "@/application/posts/post-service";
import { CreatePostData } from "@/domain/types/posts";
import { revalidatePath } from "next/cache";

/**
 * Server action to schedule a new social media post via the dashboard.
 */
export async function schedulePostAction(data: CreatePostData) {
  // 1. Authenticate user session
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth error in schedulePostAction:", authError);
    return { data: null, error: "Bản cần phải đăng nhập để thực hiện hành động này." };
  }

  // 2. Delegate to PostService
  // Ensure the account belongs to the user? 
  // (In a full scale app, we'd check if PlatformAccount belongs to ProfileId)
  const result = await PostService.schedulePost({
    ...data,
    scheduledAt: new Date(data.scheduledAt) // Ensure it's a Date object if coming from JSON
  });

  if (!result.error) {
    // 3. Clear cache for the scheduler dashboard
    revalidatePath("/(dashboard)/scheduler");
    revalidatePath("/(dashboard)/posts");
  }

  return result;
}

/**
 * Server action to fetch posts for the current view.
 */
export async function getPostsAction(accountId: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { data: null, error: "Unauthorized" };

  return await PostService.getScheduledPosts(accountId);
}
