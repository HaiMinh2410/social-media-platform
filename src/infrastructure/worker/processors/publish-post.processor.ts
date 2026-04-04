import { Job } from 'bullmq';
import { JobPayloadMap, JobType } from '@/domain/types/queue';
import { db } from '@/lib/db';
import { decryptToken } from '@/infrastructure/security/token-encryption';
import { publishPost } from '@/infrastructure/external/meta/meta-publishing.service';

// PostStatus values matching the Prisma schema enum / string literal
const POST_STATUS_PUBLISHED = 'published' as const;
const POST_STATUS_ERROR = 'error' as const;

/**
 * Processes a PUBLISH_POST job from the POST_SCHEDULER queue.
 *
 * Flow:
 *  1. Load Post + PlatformAccount from DB
 *  2. Decrypt the account's access token
 *  3. Call Meta Graph API to publish
 *  4. Update Post.status → 'published' (and store platformPostId) OR 'error'
 */
export async function processPublishPost(
  job: Job<JobPayloadMap[JobType.PUBLISH_POST]>
): Promise<void> {
  const { postId, accountId } = job.data;
  console.log(`🗓️  [PUBLISH_POST] Starting job ${job.id} | post: ${postId} | account: ${accountId}`);

  // ── 1. Load post record ────────────────────────────────────────────────────
  const post = await db.post.findUnique({
    where: { id: postId },
  });

  if (!post) {
    throw new Error(`Post not found: ${postId}`);
  }

  if (post.status !== 'scheduled') {
    console.warn(
      `⚠️  [PUBLISH_POST] Post ${postId} is not in 'scheduled' state (current: ${post.status}). Skipping.`
    );
    return;
  }

  // ── 2. Load platform account + token ──────────────────────────────────────
  const account = await db.platformAccount.findUnique({
    where: { id: accountId },
    include: {
      metaTokens: {
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!account) {
    await markPostAsError(postId, `Platform account not found: ${accountId}`);
    throw new Error(`Platform account not found: ${accountId}`);
  }

  const tokenRecord = account.metaTokens[0];
  if (!tokenRecord) {
    await markPostAsError(postId, `No access token found for account: ${accountId}`);
    throw new Error(`No access token for account: ${accountId}`);
  }

  // ── 3. Decrypt token ───────────────────────────────────────────────────────
  let accessToken: string;
  try {
    accessToken = decryptToken(tokenRecord.encryptedAccessToken);
  } catch {
    await markPostAsError(postId, 'Failed to decrypt access token.');
    throw new Error(`Token decryption failed for account: ${accountId}`);
  }

  // ── 4. Publish to Meta ─────────────────────────────────────────────────────
  const { data: publishResult, error: publishError } = await publishPost({
    pageId: account.platformUserId,
    accessToken,
    content: post.content,
    mediaUrls: post.mediaUrls as string[],
    platform: account.platform,
  });

  if (publishError || !publishResult) {
    const reason = publishError ?? 'Unknown publish error';
    await markPostAsError(postId, reason);
    throw new Error(`[PUBLISH_POST] Meta publish failed for post ${postId}: ${reason}`);
  }

  // ── 5. Update post to 'published' ─────────────────────────────────────────
  await db.post.update({
    where: { id: postId },
    data: {
      status: POST_STATUS_PUBLISHED,
      platformPostId: publishResult.platformPostId,
    },
  });

  console.log(
    `✅ [PUBLISH_POST] Post ${postId} published successfully. Platform ID: ${publishResult.platformPostId}`
  );
}

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Updates a post's status to 'error' with a reason logged to console.
 * Does not throw — the caller throws after calling this.
 */
async function markPostAsError(postId: string, reason: string): Promise<void> {
  console.error(`❌ [PUBLISH_POST] Marking post ${postId} as error: ${reason}`);
  try {
    await db.post.update({
      where: { id: postId },
      data: { status: POST_STATUS_ERROR },
    });
  } catch (dbErr) {
    console.error(`❌ [PUBLISH_POST] Failed to update post ${postId} status to error:`, dbErr);
  }
}
