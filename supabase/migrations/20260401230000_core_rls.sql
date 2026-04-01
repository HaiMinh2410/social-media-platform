-- 1. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_reply_logs ENABLE ROW LEVEL SECURITY;

-- 2. Enable Realtime (Publication)
-- Note: Ensure "supabase_realtime" publication exists first
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE conversations, messages, ai_reply_logs;

-- 3. RLS Policies

-- Profiles: User can view and update their own record
CREATE POLICY "Users can view their own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

-- Platform Accounts: User can manage their own platform integrations
CREATE POLICY "Users can view their own platform accounts" ON platform_accounts 
  FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert their own platform accounts" ON platform_accounts 
  FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can delete their own platform accounts" ON platform_accounts 
  FOR DELETE USING (auth.uid() = profile_id);

-- Meta Tokens: Only the account owner can access tokens
CREATE POLICY "Users can view their own meta tokens" ON meta_tokens 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM platform_accounts pa 
      WHERE pa.id = account_id AND pa.profile_id = auth.uid()
    )
  );

-- Conversations: Linked to account user owned by profile
CREATE POLICY "Users can view their own conversations" ON conversations 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM platform_accounts pa 
      WHERE pa.id = account_id AND pa.profile_id = auth.uid()
    )
  );

-- Messages: Linked to conversation owned by profile
CREATE POLICY "Users can view their own messages" ON messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c 
      JOIN platform_accounts pa ON c.account_id = pa.id 
      WHERE c.id = conversation_id AND pa.profile_id = auth.uid()
    )
  );

-- AI Reply Logs: Linked to message owned by profile
CREATE POLICY "Users can view their own ai logs" ON ai_reply_logs 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM messages m 
      JOIN conversations c ON m.conversation_id = c.id 
      JOIN platform_accounts pa ON c.account_id = pa.id 
      WHERE m.id = message_id AND pa.profile_id = auth.uid()
    )
  );
