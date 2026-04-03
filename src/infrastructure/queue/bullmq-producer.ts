import { Queue, JobsOptions } from "bullmq";
import { queueConnection } from "@/lib/redis";
import { QueueName, JobType, type JobPayloadMap } from "@/domain/types/queue";

const queues: Record<string, Queue> = {};

/**
 * Gets or creates a BullMQ Queue instance for and ensures connection is alive.
 */
function getQueue<T extends QueueName>(name: T): Queue {
  if (!queues[name]) {
    queues[name] = new Queue(name, {
      connection: queueConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
  }
  return queues[name];
}

/**
 * Pushes a job to a specific BullMQ Queue.
 */
export async function pushJob<T extends JobType>(
  queueName: QueueName,
  type: T,
  payload: JobPayloadMap[T],
  options: JobsOptions = {}
) {
  const queue = getQueue(queueName);
  const result = await queue.add(type, payload, options);
  console.log(`✅ [QUEUE_PRODUCER] Job "${type}" added to queue "${queueName}" with ID ${result.id}`);
  return result;
}

/**
 * Gracefully shuts down all active queue connections.
 */
export async function closeQueues() {
  for (const q of Object.values(queues)) {
    await q.close();
  }
}
