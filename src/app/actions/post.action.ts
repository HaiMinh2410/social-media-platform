'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { PostService } from '@/application/posts/post-service';
import type { PostDTO, SchedulePostInput } from '@/domain/types/posts';

// ─── Schemas ─────────────────────────────────────────────────────────────────

const SchedulePostSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  content: z.string().min(1, 'Post content is required').max(2000, 'Content too long'),
  mediaUrls: z.array(z.string().url('Invalid media URL')).max(10, 'Too many media files'),
  scheduledAt: z.string().datetime({ message: 'Invalid date format' }),
});

const GetPostsSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Converts Prisma post dates to ISO strings for JSON transport */
function toPostDTO(post: {
  id: string;
  accountId: string;
  content: string | null;
  mediaUrls: string[];
  status: string;
  scheduledAt: Date | null;
  platformPostId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PostDTO {
  return {
    id: post.id,
    accountId: post.accountId,
    content: post.content,
    mediaUrls: post.mediaUrls as string[],
    status: post.status as PostDTO['status'],
    scheduledAt: post.scheduledAt?.toISOString() ?? null,
    platformPostId: post.platformPostId,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

// ─── Actions ─────────────────────────────────────────────────────────────────

/**
 * Schedules a new post via the PostService.
 * Validates input, enqueues BullMQ job with delay, revalidates /posts.
 */
export async function schedulePostAction(
  input: SchedulePostInput
): Promise<{ data: PostDTO | null; error: string | null }> {
  const parsed = SchedulePostSchema.safeParse(input);
  if (!parsed.success) {
    const message = parsed.error.errors.map((e) => e.message).join(', ');
    return { data: null, error: message };
  }

  const { accountId, content, mediaUrls, scheduledAt } = parsed.data;

  const { data: post, error } = await PostService.schedulePost({
    accountId,
    content,
    mediaUrls,
    scheduledAt: new Date(scheduledAt),
  });

  if (error || !post) {
    return { data: null, error: error ?? 'Failed to schedule post.' };
  }

  revalidatePath('/posts');
  return { data: toPostDTO(post), error: null };
}

/**
 * Fetches all posts for a given account, ordered by scheduledAt asc.
 */
export async function getPostsByAccountAction(
  accountId: string
): Promise<{ data: PostDTO[] | null; error: string | null }> {
  const parsed = GetPostsSchema.safeParse({ accountId });
  if (!parsed.success) {
    return { data: null, error: 'Invalid account ID.' };
  }

  const { data: posts, error } = await PostService.getScheduledPosts(parsed.data.accountId);

  if (error || !posts) {
    return { data: null, error: error ?? 'Failed to load posts.' };
  }

  return { data: posts.map(toPostDTO), error: null };
}

/**
 * Cancels a scheduled post by setting its status to 'draft'.
 * Only posts with status 'scheduled' can be cancelled.
 * Note: The BullMQ job will still fire but publish-post.processor will guard against non-scheduled status.
 */
export async function cancelPostAction(
  postId: string
): Promise<{ data: PostDTO | null; error: string | null }> {
  if (!postId || typeof postId !== 'string') {
    return { data: null, error: 'Invalid post ID.' };
  }

  const { data: post, error } = await PostService.cancelPost(postId);

  if (error || !post) {
    return { data: null, error: error ?? 'Failed to cancel post.' };
  }

  revalidatePath('/posts');
  return { data: toPostDTO(post), error: null };
}
