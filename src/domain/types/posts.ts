/**
 * Domain types for social media posts.
 */

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'error';

export type Post = {
  id: string;
  accountId: string;
  content: string | null;
  mediaUrls: string[];
  status: PostStatus;
  scheduledAt: Date | null;
  platformPostId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatePostData = {
  accountId: string;
  content?: string;
  mediaUrls: string[];
  scheduledAt: Date;
};

/** Serialisable DTO used in UI (dates as ISO strings from JSON) */
export type PostDTO = {
  id: string;
  accountId: string;
  content: string | null;
  mediaUrls: string[];
  status: PostStatus;
  scheduledAt: string | null; // ISO string
  platformPostId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SchedulePostInput = {
  accountId: string;
  content: string;
  mediaUrls: string[];
  scheduledAt: string; // ISO string from form
};
