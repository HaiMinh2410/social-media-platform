import { Job } from "bullmq";
import { JobPayloadMap, JobType, QueueName } from "@/domain/types/queue";
import { pushJob } from "@/infrastructure/queue/bullmq-producer";

export async function processMessageReceived(job: Job<JobPayloadMap[JobType.MESSAGE_RECEIVED]>) {
  const { messageId, conversationId, platform, content } = job.data;
  console.log(`[PROCESSOR] Started MESSAGE_RECEIVED handling for msg: ${messageId}`);

  if (!content || content.trim() === "") {
    console.log(`[PROCESSOR] Empty message content, skipping GENERATE_REPLY. (msg: ${messageId})`);
    return;
  }

  // Queue the GENERATE_REPLY job
  await pushJob(QueueName.AI_PROCESSING, JobType.GENERATE_REPLY, {
    messageId,
    conversationId,
  });

  console.log(`✅ [PROCESSOR] MESSAGE_RECEIVED processed. Queued GENERATE_REPLY for msg: ${messageId}`);
}
