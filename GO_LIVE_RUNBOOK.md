# 🚀 SOCIAL MEDIA PLATFORM — GO-LIVE RUNBOOK

> Tài liệu hướng dẫn triển khai và vận hành hệ thống Social Media Management Platform trên môi trường Production.

---

## 🏗️ 1. INFRASTRUCTURE SETUP

### 🔹 Supabase (Database & Storage)
1.  **Project**: Tạo project mới trên Supabase (Region: Southeast Asia nếu phục vụ VN).
2.  **Database**: Chạy migration bằng lệnh `npx prisma migrate deploy` (sử dụng `DIRECT_URL`).
3.  **Realtime**:
    - Vào `Database -> Replication`.
    - Enable Replication cho các bảng: `conversations`, `messages`, `ai_reply_logs`.
4.  **Storage**:
    - Tạo bucket `media` (Public: false, RLS enabled).
    - Tạo bucket `backups` (Private, chỉ Admin access).
5.  **RLS Policies**: Xác minh toàn bộ bảng đã có policy `authenticated` hoặc `service_role`.

### 🔹 Fly.io (BullMQ Worker)
1.  **Deploy**: Chạy lệnh `fly deploy`.
2.  **Secrets**: Thiết lập các biến ENV (giống Vercel) bằng `fly secrets set KEY=VALUE`.
3.  **Postgres**: Đảm bảo Worker có thể kết nối tới Supabase qua port 5432 (Transaction Pooler).

---

## 🔑 2. ENVIRONMENT VARIABLES (SECRET)

Cần cấu hình các biến này trên **Vercel** và **Fly.io**:

| Category | Variables |
|---|---|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| **Database** | `DATABASE_URL` (Port 5432), `DIRECT_URL` (Port 5432 - Migrate) |
| **Redis** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` |
| **AI (Groq)** | `GROQ_API_KEY` |
| **Meta** | `META_APP_ID`, `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`, `META_TOKEN_ENCRYPTION_KEY` |
| **TikTok** | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_TOKEN_ENCRYPTION_KEY` |
| **Sentry** | `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` |

---

## 🌐 3. EXTERNAL PLATFORMS CONFIG

### 🔵 Meta for Developers
1.  **App Mode**: Chuyển app sang `Live`.
2.  **Callback URL**: `https://your-domain.com/api/auth/callback/meta`.
3.  **Webhooks**:
    - URL: `https://your-domain.com/api/webhooks/meta`.
    - Subscriptions: `messages`, `messaging_postbacks`, `messaging_optins`.
4.  **Permissions**: Yêu cầu review `pages_messaging`, `pages_manage_metadata` nếu chưa được cấp.

### 🎵 TikTok for Developers
1.  **App Status**: Đảm bảo App đã được duyệt (Approved).
2.  **Redirect URI**: `https://your-domain.com/api/auth/callback/tiktok`.
3.  **Webhook**: Cấu hình endpoint xử lý tin nhắn TikTok.

---

## 🛠️ 4. OPERATIONAL CHECKLIST (DAY 1)

- [ ] **Auth Flow**: Test login bằng tài khoản Admin/Manager thật.
- [ ] **AI Pipeline**: Gửi một tin nhắn test từ Facebook Page -> Kiểm tra AI có generate reply trong `ai_reply_logs`.
- [ ] **Worker Status**: Truy cập Fly.io dashboard kiểm tra log worker không có lỗi connection Redis/DB.
- [ ] **Backup Job**: Trigger thủ công một job `DATABASE_BACKUP` -> Kiểm tra file `.sql.gz` xuất hiện trong Supabase Storage.
- [ ] **Analytics**: Sau 24h, kiểm tra Dashboard có dữ liệu đồng bộ từ Meta.
- [ ] **Sentry**: Verify error "Test Sentry" xuất hiện trên Dashboard.

---

## 🚨 5. INCIDENT RESPONSE

1.  **Lỗi Redis/BullMQ**: Kiểm tra Upstash connection limit. Nếu vượt ngưỡng, nâng cấp gói Pay-as-you-go.
2.  **Meta Token Expired**: Chạy manual cron job `/api/cron/refresh-tokens` (cần Secret header).
3.  **Worker Down**: Kiểm tra `fly status`. Thử `fly restart`.
4.  **DB Backup Fail**: Kiểm tra dung lượng Storage và quyền của Service Role Key.
