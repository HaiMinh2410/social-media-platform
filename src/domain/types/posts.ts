/**
 * Domain types for social media posts.
 */

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'error';

export interface Post {
  id: string;
  accountId: string;
  content: string | null;
  mediaUrls: string[];
  status: PostStatus;
  scheduledAt: Date | null;
  platformPostId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostData {
  accountId: string;
  content?: string;
  mediaUrls: string[];
  scheduledAt: Date;
}
