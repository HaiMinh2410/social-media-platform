import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import os from "os";
import fs from "fs/promises";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/infrastructure/config/env-registry";

const execAsync = promisify(exec);

export class DatabaseBackupService {
  private static readonly BUCKET_NAME = "backups";
  private static readonly RETENTION_DAYS = 30;

  /**
   * Performs a database dump, compresses it, and returns the local file path.
   */
  static async dumpDatabase(): Promise<{ filePath: string; fileName: string }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `backup-${timestamp}.sql.gz`;
    const tempFilePath = path.join(os.tmpdir(), `backup-${timestamp}.sql`);
    const gzipFilePath = `${tempFilePath}.gz`;

    try {
      console.log(`[BACKUP_SERVICE] Starting dump to ${tempFilePath}...`);
      
      // Use DIRECT_URL for pg_dump to avoid pooler issues
      const dbUrl = env.DIRECT_URL || env.DATABASE_URL;
      
      // Execute pg_dump
      await execAsync(`pg_dump "${dbUrl}" -f "${tempFilePath}"`);
      
      console.log(`[BACKUP_SERVICE] Compressing dump...`);
      await execAsync(`gzip "${tempFilePath}"`);

      return { filePath: gzipFilePath, fileName };
    } catch (error) {
      console.error("[BACKUP_SERVICE] Error during dumpDatabase:", error);
      throw error;
    }
  }

  /**
   * Uploads the backup file to Supabase Storage and cleans up the local file.
   */
  static async uploadAndCleanup(filePath: string, fileName: string): Promise<void> {
    const supabase = createAdminClient();
    
    try {
      const fileBuffer = await fs.readFile(filePath);
      
      console.log(`[BACKUP_SERVICE] Uploading ${fileName} to bucket '${this.BUCKET_NAME}'...`);
      
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, fileBuffer, {
          contentType: "application/gzip",
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to upload backup: ${error.message}`);
      }

      console.log(`[BACKUP_SERVICE] Backup uploaded successfully.`);
    } finally {
      // Always cleanup local temp file
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.warn(`[BACKUP_SERVICE] Could not delete temp file ${filePath}:`, unlinkError);
      }
    }
  }

  /**
   * Removes backups older than RETENTION_DAYS from the storage bucket.
   */
  static async pruneOldBackups(): Promise<void> {
    const supabase = createAdminClient();
    const pruneDate = new Date();
    pruneDate.setDate(pruneDate.getDate() - this.RETENTION_DAYS);

    try {
      console.log(`[BACKUP_SERVICE] Pruning backups older than ${pruneDate.toISOString()}...`);
      
      const { data: files, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list();

      if (error) throw error;
      if (!files) return;

      const filesToDelete = files
        .filter(f => f.created_at && new Date(f.created_at) < pruneDate)
        .map(f => f.name);

      if (filesToDelete.length > 0) {
        console.log(`[BACKUP_SERVICE] Deleting ${filesToDelete.length} old backups...`);
        const { error: deleteError } = await supabase.storage
          .from(this.BUCKET_NAME)
          .remove(filesToDelete);
        
        if (deleteError) throw deleteError;
        console.log(`[BACKUP_SERVICE] Pruning completed.`);
      } else {
        console.log(`[BACKUP_SERVICE] No old backups to prune.`);
      }
    } catch (error) {
      console.error("[BACKUP_SERVICE] Error during pruneOldBackups:", error);
    }
  }
}
