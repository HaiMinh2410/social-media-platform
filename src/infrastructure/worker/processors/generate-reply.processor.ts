import { Job } from "bullmq";
import { JobPayloadMap, JobType } from "@/domain/types/queue";
import { db } from "@/lib/db";
import { generateSocialMediaReply } from "@/application/ai/ai.service";
import { AiMessage } from "@/domain/types/ai";

export async function processGenerateReply(job: Job<JobPayloadMap[JobType.GENERATE_REPLY]>) {
  const { messageId, conversationId } = job.data;
  console.log(`[PROCESSOR] Starting GENERATE_REPLY for msg: ${messageId}`);

  // Fetch conversation and messages
  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      platformAccount: true,
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    throw new Error(`Conversation not found: ${conversationId}`);
  }

  const targetMessage = conversation.messages.find((m) => m.id === messageId);
  if (!targetMessage) {
    throw new Error(`Target message not found: ${messageId}`);
  }

  // Construct conversation context
  const aiMessages: AiMessage[] = conversation.messages.map((msg) => ({
    role: msg.senderId === conversation.platformAccount.platformUserId ? "assistant" : "user",
    content: msg.content,
  }));

  // Generate reply
  const result = await generateSocialMediaReply({
    platform: conversation.platformAccount.platform,
    conversationContext: aiMessages,
    isComment: job.data.metadata?.isComment === true,
  });

  // Save AI log to DB
  await db.aIReplyLog.create({
    data: {
      messageId: messageId,
      prompt: "System & Context passed to LLM for reply generation.",
      response: result.reply,
      model: result.model,
    },
  });

  console.log(`✅ [PROCESSOR] GENERATE_REPLY success. Log persisted for msg: ${messageId}`);
}
