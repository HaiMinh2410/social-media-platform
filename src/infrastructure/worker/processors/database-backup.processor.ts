import { Job } from "bullmq";
import { DatabaseBackupService } from "@/infrastructure/maintenance/database-backup.service";

export const databaseBackupProcessor = async (job: Job) => {
  console.log(`[WORKER] Starting database backup job: ${job.id}`);
  
  try {
    // 1. Create dump
    const { filePath, fileName } = await DatabaseBackupService.dumpDatabase();
    
    // 2. Upload to storage and cleanup local temp
    await DatabaseBackupService.uploadAndCleanup(filePath, fileName);
    
    // 3. Prune old backups (>30d)
    await DatabaseBackupService.pruneOldBackups();

    console.log(`[WORKER] Database backup job ${job.id} completed successfully.`);
    return { success: true, fileName };
  } catch (error) {
    console.error(`[WORKER] Database backup job ${job.id} failed:`, error);
    throw error;
  }
};
