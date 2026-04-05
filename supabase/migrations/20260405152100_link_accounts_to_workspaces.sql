-- Step 1: Add workspace_id column (nullable for now)
ALTER TABLE public.platform_accounts ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id);

-- Step 2: For each existing profile, create a default workspace if it doesn't have one
DO $$
DECLARE
    profile_record RECORD;
    new_workspace_id uuid;
BEGIN
    FOR profile_record IN SELECT id, full_name FROM public.profiles LOOP
        -- Create a default workspace for each profile
        INSERT INTO public.workspaces (name, slug)
        VALUES (
            COALESCE(profile_record.full_name, 'My Workspace') || ' (Default)',
            'ws-' || substr(profile_record.id::text, 1, 8) || '-' || substr(md5(random()::text), 1, 6)
        )
        RETURNING id INTO new_workspace_id;

        -- Add profile as admin of new workspace
        INSERT INTO public.workspace_members (workspace_id, profile_id, role)
        VALUES (new_workspace_id, profile_record.id, 'admin');

        -- Link profile's existing accounts to this new workspace
        UPDATE public.platform_accounts
        SET workspace_id = new_workspace_id
        WHERE profile_id = profile_record.id;
    END LOOP;
END $$;

-- Step 3: Make workspace_id NOT NULL
-- This might fail if there are accounts without a profile_id for some reason, but we check and update all.
ALTER TABLE public.platform_accounts ALTER COLUMN workspace_id SET NOT NULL;

-- Step 4: Add index for performance
CREATE INDEX idx_platform_accounts_workspace_id ON public.platform_accounts(workspace_id);

-- Step 5: Update RLS Policies for platform_accounts
-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own platform accounts" ON public.platform_accounts;
DROP POLICY IF EXISTS "Users can insert their own platform accounts" ON public.platform_accounts;
DROP POLICY IF EXISTS "Users can delete their own platform accounts" ON public.platform_accounts;

-- New Workspace-based policies
CREATE POLICY "Workspace members can view platform accounts" ON public.platform_accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = public.platform_accounts.workspace_id AND wm.profile_id = auth.uid()
    )
  );

CREATE POLICY "Workspace admins/managers can insert platform accounts" ON public.platform_accounts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = public.platform_accounts.workspace_id AND wm.profile_id = auth.uid() 
      AND wm.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Workspace admins/managers can delete platform accounts" ON public.platform_accounts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = public.platform_accounts.workspace_id AND wm.profile_id = auth.uid() 
      AND wm.role IN ('admin', 'manager')
    )
  );
