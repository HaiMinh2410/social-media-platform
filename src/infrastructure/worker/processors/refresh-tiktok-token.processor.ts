import { Job } from "bullmq";
import { db } from "@/lib/db";
import { tiktokAuthService } from "@/infrastructure/external/tiktok/tiktok-auth.service";
import { encryptToken, decryptToken } from "@/infrastructure/security/token-encryption";
import { env } from "@/infrastructure/config/env-registry";

/**
 * Processor for JobType.REFRESH_TIKTOK_TOKEN.
 * Refreshes the access token using the encrypted refresh token.
 */
export async function processRefreshTikTokToken(job: Job): Promise<void> {
  const { accountId } = job.data as { accountId: string };
  console.log(`🕒 [PROCESSOR] Starting TikTok token refresh for account: ${accountId}`);

  try {
    // 1. Fetch the latest token record
    const tokenRecord = await db.tikTokToken.findFirst({
      where: { accountId },
    });

    if (!tokenRecord) {
      throw new Error(`TikTok token record not found for account: ${accountId}`);
    }

    if (!tokenRecord.refreshToken) {
      throw new Error(`No refresh token available for TikTok account: ${accountId}`);
    }

    // 2. Decrypt the refresh token
    const decryptedRefreshToken = decryptToken(
      tokenRecord.refreshToken, 
      env.TIKTOK_TOKEN_ENCRYPTION_KEY
    );

    // 3. Call TikTok API to refresh
    const refreshResult = await tiktokAuthService.refreshAccessToken(decryptedRefreshToken);

    // 4. Update the record with new encrypted tokens
    await db.$transaction([
      db.tikTokToken.update({
        where: { id: tokenRecord.id },
        data: {
          accessToken: encryptToken(refreshResult.access_token, env.TIKTOK_TOKEN_ENCRYPTION_KEY),
          refreshToken: refreshResult.refresh_token 
            ? encryptToken(refreshResult.refresh_token, env.TIKTOK_TOKEN_ENCRYPTION_KEY) 
            : tokenRecord.refreshToken, // Keep old one if not rotated
          expiresAt: new Date(Date.now() + refreshResult.expires_in * 1000),
          refreshTokenExpiresAt: refreshResult.refresh_expires_in 
            ? new Date(Date.now() + refreshResult.refresh_expires_in * 1000)
            : tokenRecord.refreshTokenExpiresAt,
          updatedAt: new Date(),
        },
      }),
      db.tikTokTokenRefresh.create({
        data: {
          tokenId: tokenRecord.id,
          status: "success",
        },
      }),
    ]);

    console.log(`✅ [PROCESSOR] TikTok token refreshed successfully for account: ${accountId}`);
  } catch (error: any) {
    const errorMessage = error.message || "Unknown error during TikTok token refresh";
    console.error(`❌ [PROCESSOR] TikTok token refresh failed for account: ${accountId}:`, errorMessage);

    // Try to log the failure to the refresh history if we have the token ID
    try {
      const tokenRecord = await db.tikTokToken.findFirst({ where: { accountId } });
      if (tokenRecord) {
        await db.tikTokTokenRefresh.create({
          data: {
            tokenId: tokenRecord.id,
            status: "failed",
            error: errorMessage,
          },
        });
      }
    } catch (logError) {
      console.error("❌ [PROCESSOR] Failed to log refresh failure to DB:", logError);
    }

    throw error; // Reject job to allow BullMQ to handle retries
  }
}
