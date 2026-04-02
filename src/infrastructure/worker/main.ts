import { Worker, type Job } from "bullmq";
import { queueConnection } from "@/lib/redis";
import { QueueName } from "@/domain/types/queue";
import { processors } from "@/infrastructure/worker/processors";

/**
 * Worker entrypoint to initialize processors and start consuming jobs.
 */
export async function startWorker() {
  console.log(`👷 [WORKER] Initializing worker for queue: "${QueueName.AI_PROCESSING}"...`);

  const worker = new Worker(
    QueueName.AI_PROCESSING,
    async (job: Job) => {
      const handler = processors[job.name as keyof typeof processors];
      if (!handler) {
        console.warn(`⚠️ [WORKER] No handler registered for job type: ${job.name}`);
        return;
      }

      console.log(`⚡ [WORKER] Processing job: ${job.id} (${job.name})`);
      try {
        await handler(job);
        console.log(`✅ [WORKER] Successfully processed job ${job.id}`);
      } catch (error) {
        console.error(`❌ [WORKER] Failed job ${job.id}:`, error);
        throw error; // Let BullMQ handle retries
      }
    },
    {
      connection: queueConnection,
      concurrency: 5,
    }
  );

  worker.on("ready", () => {
    console.log(`✅ [WORKER] Worker is ready and waiting for jobs on "${QueueName.AI_PROCESSING}"`);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ [WORKER] Job ${job?.id} failed in "${QueueName.AI_PROCESSING}":`, err.message);
  });

  process.on("SIGINT", async () => {
    console.log("👷 [WORKER] Shutting down gracefully...");
    await worker.close();
    process.exit(0);
  });
}

// Start worker directly if this file is run
if (require.main === module) {
  startWorker().catch((err) => {
    console.error("❌ [WORKER] Fatal error on startup:", err);
    process.exit(1);
  });
}
