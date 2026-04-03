"use server";

import { createClient } from "@/lib/supabase/server";
import { StorageService, UploadResult } from "@/application/media/storage-service";
import { revalidatePath } from "next/cache";

/**
 * Server action to upload media files from the dashboard.
 * Requires an authenticated user session.
 */
export async function uploadMediaAction(formData: FormData): Promise<UploadResult> {
  const file = formData.get("file") as File;
  if (!file) {
    return { data: null, error: "No file provided" };
  }

  // 1. Authenticate user
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Auth error in uploadMediaAction:", authError);
    return { data: null, error: "Bản cần phải đăng nhập để upload files." };
  }

  // 2. Delegate to StorageService
  const result = await StorageService.uploadFile(
    file,
    file.name,
    file.type,
    user.id
  );

  if (result.error) {
    return result;
  }

  // 3. Optional: Revalidate paths that show media
  revalidatePath("/(dashboard)/scheduler");
  revalidatePath("/(dashboard)/analytics");

  return result;
}
