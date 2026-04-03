import { db } from '../src/lib/db';
import { analyticsService } from '../src/application/analytics/analytics-sync.service';

async function testSync() {
  console.log('🚀 [TEST] Fetching first Meta account...');
  const account = await db.platformAccount.findFirst({
    where: { platform: { in: ['facebook', 'instagram'] } }
  });

  if (!account) {
    console.warn('⚠️ [TEST] No Meta platform account found in database. Please connect one first.');
    return;
  }

  console.log(`📡 [TEST] Running sync for account: ${account.platformUserName} (ID: ${account.id})`);
  const result = await analyticsService.syncAccount(account.id);

  if (result.success) {
    console.log('✅ [TEST] Sync successful!');
  } else {
    console.error(`❌ [TEST] Sync failed: ${result.error}`);
  }
}

testSync().catch(console.error).finally(() => db.$disconnect());
