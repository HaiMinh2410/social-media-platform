import { db } from '@/lib/db';
import { PostService } from '@/application/posts/post-service';
import { PostsClient } from '@/components/posts/posts-client';
import type { PostDTO } from '@/domain/types/posts';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Posts | SocialAgent',
  description: 'Schedule and manage social media posts across your connected accounts.',
};

/** Converts Prisma post object to serialisable PostDTO */
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

/**
 * Posts Page — Server Component
 *
 * Fetches the user's connected platform accounts and their scheduled posts,
 * then passes them to the PostsClient for interactive calendar/list management.
 */
export default async function PostsPage() {
  // 1. Fetch all platform accounts (ordered by creation for consistency)
  const accounts = await db.platformAccount.findMany({
    where: { platform: { in: ['facebook', 'instagram', 'FACEBOOK', 'INSTAGRAM'] } },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      platformUserName: true,
      platform: true,
    },
  });

  // 2. Fetch posts for all accounts in parallel
  const postsResults = await Promise.all(
    accounts.map((acc) => PostService.getScheduledPosts(acc.id))
  );

  const allPosts: PostDTO[] = postsResults
    .flatMap((result) => result.data ?? [])
    .map(toPostDTO);

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 h-full">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Content Calendar</h1>
        <p className="text-slate-400 text-sm mt-1">
          Schedule and manage posts across{' '}
          {accounts.length > 0
            ? `${accounts.length} connected account${accounts.length > 1 ? 's' : ''}`
            : 'your connected accounts'}
          .
        </p>
      </div>

      {/* Client section */}
      <PostsClient initialPosts={allPosts} accounts={accounts} />
    </div>
  );
}
