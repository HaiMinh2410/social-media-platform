import { Worker, type Job } from "bullmq";
import * as Sentry from "@sentry/nextjs";
import { queueConnection } from "@/lib/redis";
import { QueueName } from "@/domain/types/queue";
import { processors } from "@/infrastructure/worker/processors";

// ─── Sentry Initiation ────────────────────────────────────────────────────────

const initializeSentry = () => {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return;

    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
      environment: process.env.NODE_ENV || 'development',
    });
    console.log('✅ [SENTRY] Background Worker instrumentation active.');
};

// ─── Types ───────────────────────────────────────────────────────────────────

type WorkerConfig = {
  queueName: QueueName;
  concurrency: number;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const WORKER_CONFIGS: WorkerConfig[] = [
  { queueName: QueueName.AI_PROCESSING, concurrency: 5 },
  { queueName: QueueName.POST_SCHEDULER, concurrency: 3 },
];

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Creates and starts a BullMQ Worker for a given queue.
 * Routes incoming jobs to the correct processor via the processors registry.
 */
function createWorker(config: WorkerConfig): Worker {
  const { queueName, concurrency } = config;

  console.log(`👷 [WORKER] Initializing worker for queue: "${queueName}"...`);

  const worker = new Worker(
    queueName,
    async (job: Job) => {
      const handler = processors[job.name as keyof typeof processors];

      if (!handler) {
        console.warn(`⚠️  [WORKER:${queueName}] No handler for job type: "${job.name}". Skipping.`);
        return;
      }

      console.log(`⚡ [WORKER:${queueName}] Processing job ${job.id} (${job.name})`);
      await handler(job);
      console.log(`✅ [WORKER:${queueName}] Job ${job.id} (${job.name}) completed.`);
    },
    {
      connection: queueConnection,
      concurrency,
    }
  );

  worker.on("ready", () => {
    console.log(`✅ [WORKER:${queueName}] Ready — listening for jobs.`);
  });

  worker.on("failed", (job, err) => {
    console.error(
      `❌ [WORKER:${queueName}] Job ${job?.id} (${job?.name}) failed: ${err.message}`
    );

    // Report failure to Sentry with context
    Sentry.captureException(err, {
        extra: {
            jobId: job?.id,
            jobName: job?.name,
            queueName: queueName,
            payload: job?.data,
        },
        tags: {
            queue: queueName,
            job_type: job?.name,
        }
    });
  });

  return worker;
}

// ─── Entrypoint ───────────────────────────────────────────────────────────────

/**
 * Starts all configured workers.
 * Each worker listens on its configured queue concurrently.
 */
export async function startWorker(): Promise<void> {
  initializeSentry();

  const workers = WORKER_CONFIGS.map(createWorker);


  console.log(`🚀 [WORKER] All ${workers.length} workers started.`);

  process.on("SIGINT", async () => {
    console.log("\n👷 [WORKER] SIGINT received — shutting down gracefully...");
    await Promise.all(workers.map((w) => w.close()));
    console.log("✅ [WORKER] All workers shut down cleanly.");
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("\n👷 [WORKER] SIGTERM received — shutting down gracefully...");
    await Promise.all(workers.map((w) => w.close()));
    console.log("✅ [WORKER] All workers shut down cleanly.");
    process.exit(0);
  });
}

// Start worker directly if this file is the entry point
if (require.main === module) {
  startWorker().catch((err) => {
    console.error("❌ [WORKER] Fatal startup error:", err);
    process.exit(1);
  });
}
