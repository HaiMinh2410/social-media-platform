import { createClient } from "@/lib/supabase/server";

export interface UploadResult {
  data: {
    path: string;
    url: string;
  } | null;
  error: string | null;
}

export class StorageService {
  /**
   * Upload a file to Supabase Storage in the 'media' bucket.
   * Path format: [userId]/[uuid].[extension]
   */
  static async uploadFile(
    file: Buffer | Blob | File,
    fileName: string,
    contentType: string,
    userId: string
  ): Promise<UploadResult> {
    const supabase = createClient();
    
    // Extract extension
    const fileExt = fileName.split(".").pop() || "";
    // Generate unique name
    const uuid = crypto.randomUUID();
    const path = `${userId}/${uuid}${fileExt ? `.${fileExt}` : ""}`;

    try {
      // 1. Upload to bucket
      const { data, error: uploadError } = await supabase.storage
        .from("media")
        .upload(path, file, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        console.error("Supabase storage upload error:", uploadError);
        return { data: null, error: uploadError.message };
      }

      // 2. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("media")
        .getPublicUrl(path);

      return {
        data: {
          path: data.path,
          url: publicUrl,
        },
        error: null,
      };
    } catch (err) {
      console.error("StorageService.uploadFile unexpected error:", err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : "Internal server error during upload" 
      };
    }
  }
}
