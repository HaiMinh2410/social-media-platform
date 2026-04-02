import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { metaWebhookHandler } from '@/infrastructure/external/meta/webhook-handler.service';
import { QueueName, JobType } from '@/domain/types/queue';
import { pushJob } from '@/infrastructure/queue/bullmq-producer';

export async function GET(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    const supabase = await createClient();

    // 1. Check DB connections
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id').limit(1);
    if (pError) throw new Error(`Profiles check failed: ${pError.message}`);
    
    // We don't want to create test users here since Supabase Auth Admin requires service key.
    // Let's just create a dummy Platform Account that bypasses RLS or just test the Webhook handler 
    // with a "warn" instead of full insert if no account exists!
    // Actually, we can just push a fake job to BullMQ directly to test the worker.
    
    // A) Push a job directly to test worker
    const fakeMid = `m_${Date.now()}`;
    await pushJob(QueueName.AI_PROCESSING, JobType.MESSAGE_RECEIVED, {
      messageId: "DUMMY_ID_FOR_WORKER_TEST",
      conversationId: "DUMMY_CONV",
      platform: "META",
      content: "Hello E2E Worker Test!"
    });

    return NextResponse.json({
      success: true,
      message: 'E2E job pushed to Queue. Please check worker logs.',
      simulatedId: fakeMid
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
