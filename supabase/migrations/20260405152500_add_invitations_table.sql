-- Migration: add_invitations_table_v1
-- Description: Create invitations table and RLS policies

-- Create Invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'agent', 'viewer')),
  token text NOT NULL UNIQUE,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'revoked', 'expired'))
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Select: Any member of the workspace can see invitations
CREATE POLICY "Workspace members can view invitations" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = public.invitations.workspace_id AND wm.profile_id = auth.uid()
    )
  );

-- Insert/Update/Delete: Admins and Managers only
CREATE POLICY "Admins/Managers can manage invitations" ON public.invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = public.invitations.workspace_id 
      AND wm.profile_id = auth.uid()
      AND wm.role IN ('admin', 'manager')
    )
  );

-- Select policy for workspace_members (existing policy might be missing or limited)
DROP POLICY IF EXISTS "Members can view other members in same workspace" ON public.workspace_members;
CREATE POLICY "Members can view other members in same workspace" ON public.workspace_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.workspace_members wm
      WHERE wm.workspace_id = public.workspace_members.workspace_id AND wm.profile_id = auth.uid()
    )
  );
