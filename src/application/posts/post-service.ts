import { db } from "@/lib/db";
import { pushJob } from "@/infrastructure/queue/bullmq-producer";
import { QueueName, JobType } from "@/domain/types/queue";
import { CreatePostData } from "@/domain/types/posts";

export class PostService {
  /**
   * Schedules a post by creating a DB record and enqueuing a BullMQ job with delay.
   */
  static async schedulePost(data: CreatePostData) {
    try {
      // 1. Create Post record in database
      const post = await db.post.create({
        data: {
          accountId: data.accountId,
          content: data.content,
          mediaUrls: data.mediaUrls,
          scheduledAt: data.scheduledAt,
          status: "scheduled",
        },
      });

      // 2. Calculate delay for BullMQ
      const delay = data.scheduledAt.getTime() - Date.now();
      const finalDelay = Math.max(0, delay);

      // 3. Enqueue the publication job
      await pushJob(
        QueueName.POST_SCHEDULER,
        JobType.PUBLISH_POST,
        {
          postId: post.id,
          accountId: data.accountId,
        },
        { delay: finalDelay }
      );

      console.log(`📡 [POST_SERVICE] Post ${post.id} scheduled for ${data.scheduledAt.toISOString()}`);
      return { data: post, error: null };
    } catch (error) {
      console.error("PostService.schedulePost error:", error);
      return {
        data: null,
        error: error instanceof Error ? error.message : "Đã xảy ra lỗi khi lập lịch bài viết.",
      };
    }
  }

  /**
   * Fetches all posts for a specific account, ordered by scheduledAt asc.
   */
  static async getScheduledPosts(accountId: string) {
    try {
      const posts = await db.post.findMany({
        where: { accountId },
        orderBy: { scheduledAt: "asc" },
      });
      return { data: posts, error: null };
    } catch (error) {
      return { data: null, error: "Không thể lấy danh sách bài viết." };
    }
  }

  /**
   * Cancels a scheduled post by setting status to 'draft'.
   * The BullMQ job may still fire but the processor will skip non-scheduled posts.
   */
  static async cancelPost(postId: string) {
    try {
      const post = await db.post.update({
        where: { id: postId, status: "scheduled" },
        data: { status: "draft" },
      });
      return { data: post, error: null };
    } catch (error) {
      return { data: null, error: "Could not cancel post. It may have already been published." };
    }
  }
}
