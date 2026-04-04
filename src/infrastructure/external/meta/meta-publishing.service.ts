/**
 * Meta Publishing Service
 * Handles publishing feed posts (text, photo, video) to Facebook Pages
 * and Instagram Business accounts via the Meta Graph API.
 */

const GRAPH_API_VERSION = 'v19.0';
const GRAPH_API_URL = 'https://graph.facebook.com';

// ─── Types ───────────────────────────────────────────────────────────────────

type MetaApiErrorBody = {
  error?: {
    message: string;
    type: string;
    code: number;
  };
};

type MetaPublishResult = {
  id: string; // The ID of the created post on the platform
};

export type PublishPostInput = {
  /** The Facebook Page ID or Instagram Business Account ID */
  pageId: string;
  /** Page access token (decrypted) */
  accessToken: string;
  /** Text content of the post */
  content: string | null;
  /** Public URLs of media to attach (photos/videos) */
  mediaUrls: string[];
  /** The publishing platform — determines which endpoint to use */
  platform: string;
};

export type PublishPostResult = {
  data: { platformPostId: string } | null;
  error: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Publishes a photo post to a Facebook Page feed.
 * If multiple photos, the first is used (batch upload is out of MVP scope).
 */
async function publishFacebookPhotoPost(
  pageId: string,
  accessToken: string,
  content: string | null,
  photoUrl: string
): Promise<PublishPostResult> {
  const url = `${GRAPH_API_URL}/${GRAPH_API_VERSION}/${pageId}/photos`;

  const body: Record<string, string> = {
    url: photoUrl,
    access_token: accessToken,
  };
  if (content) body['caption'] = content;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as MetaPublishResult & MetaApiErrorBody;

  if (!response.ok || data.error) {
    const msg = data.error?.message ?? `Meta API error: ${response.status}`;
    return { data: null, error: msg };
  }

  return { data: { platformPostId: data.id }, error: null };
}

/**
 * Publishes a text-only post to a Facebook Page feed.
 */
async function publishFacebookTextPost(
  pageId: string,
  accessToken: string,
  content: string
): Promise<PublishPostResult> {
  const url = `${GRAPH_API_URL}/${GRAPH_API_VERSION}/${pageId}/feed`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: content,
      access_token: accessToken,
    }),
  });

  const data = (await response.json()) as MetaPublishResult & MetaApiErrorBody;

  if (!response.ok || data.error) {
    const msg = data.error?.message ?? `Meta API error: ${response.status}`;
    return { data: null, error: msg };
  }

  return { data: { platformPostId: data.id }, error: null };
}

/**
 * Publishes a photo post to Instagram Business via the Content Publishing API.
 * Two-step: create media container → publish.
 */
async function publishInstagramPost(
  igUserId: string,
  accessToken: string,
  content: string | null,
  imageUrl: string
): Promise<PublishPostResult> {
  // Step 1: Create media container
  const containerUrl = `${GRAPH_API_URL}/${GRAPH_API_VERSION}/${igUserId}/media`;
  const containerBody: Record<string, string> = {
    image_url: imageUrl,
    access_token: accessToken,
  };
  if (content) containerBody['caption'] = content;

  const containerRes = await fetch(containerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(containerBody),
  });

  const containerData = (await containerRes.json()) as { id: string } & MetaApiErrorBody;

  if (!containerRes.ok || containerData.error) {
    const msg = containerData.error?.message ?? `IG container error: ${containerRes.status}`;
    return { data: null, error: msg };
  }

  // Step 2: Publish the container
  const publishUrl = `${GRAPH_API_URL}/${GRAPH_API_VERSION}/${igUserId}/media_publish`;
  const publishRes = await fetch(publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerData.id,
      access_token: accessToken,
    }),
  });

  const publishData = (await publishRes.json()) as MetaPublishResult & MetaApiErrorBody;

  if (!publishRes.ok || publishData.error) {
    const msg = publishData.error?.message ?? `IG publish error: ${publishRes.status}`;
    return { data: null, error: msg };
  }

  return { data: { platformPostId: publishData.id }, error: null };
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Routes the publish request to the correct platform-specific handler.
 * Supports: FACEBOOK (photo or text), INSTAGRAM (photo).
 */
export async function publishPost(input: PublishPostInput): Promise<PublishPostResult> {
  const { pageId, accessToken, content, mediaUrls, platform } = input;

  const normalizedPlatform = platform.toUpperCase();

  if (normalizedPlatform === 'INSTAGRAM') {
    if (mediaUrls.length === 0) {
      return { data: null, error: 'Instagram posts require at least one image URL.' };
    }
    return publishInstagramPost(pageId, accessToken, content, mediaUrls[0]);
  }

  // Default: FACEBOOK (PAGE / MESSENGER_PAGE)
  if (mediaUrls.length > 0) {
    return publishFacebookPhotoPost(pageId, accessToken, content, mediaUrls[0]);
  }

  if (!content || content.trim().length === 0) {
    return { data: null, error: 'Post must have content or at least one media URL.' };
  }

  return publishFacebookTextPost(pageId, accessToken, content);
}
