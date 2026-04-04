import { Job } from "bullmq";
import { JobType } from "@/domain/types/queue";
import { processMessageReceived } from "./message-received.processor";
import { processGenerateReply } from "./generate-reply.processor";
import { processPublishPost } from "./publish-post.processor";

/**
 * Interface representing a map of job processors by their JobType.
 */
export type ProcessorMap = {
  [K in JobType]?: (job: Job) => Promise<any>;
};

/**
 * Registry of active processors for the worker.
 */
export const processors: ProcessorMap = {
  [JobType.MESSAGE_RECEIVED]: processMessageReceived,
  [JobType.GENERATE_REPLY]: processGenerateReply,
  [JobType.REFRESH_META_TOKEN]: async (job: Job) => {
    const { accountId } = job.data as { accountId: string };
    console.log(`[PROCESSOR] Starting REFRESH_META_TOKEN for account: ${accountId}`);

    const { db } = await import("@/lib/db");
    const { metaAuthService } = await import("@/infrastructure/external/meta/meta-auth.service");
    const { encryptToken, decryptToken } = await import("@/infrastructure/security/token-encryption");

    const tokenRecord = await db.metaToken.findFirst({
      where: { accountId },
    });

    if (!tokenRecord) {
      throw new Error(`No token record found for account: ${accountId}`);
    }

    const decryptedToken = decryptToken(tokenRecord.encryptedAccessToken);
    const refreshResult = await metaAuthService.refreshAccessToken(decryptedToken);

    await db.metaToken.update({
      where: { id: tokenRecord.id },
      data: {
        encryptedAccessToken: encryptToken(refreshResult.access_token),
        expiresAt: new Date(Date.now() + refreshResult.expires_in * 1000),
      },
    });

    console.log(`✅ [PROCESSOR] REFRESH_META_TOKEN success for account: ${accountId}`);
  },
  [JobType.PUBLISH_POST]: processPublishPost,
};
