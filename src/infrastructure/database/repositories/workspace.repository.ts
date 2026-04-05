import { createClient } from '@/lib/supabase/server';
import { Workspace, WorkspaceMemberWithProfile, Invitation, WorkspaceRole } from '@/domain/types/workspace';
import { Database } from '@/domain/types/database.types';

export async function getMyWorkspaces(): Promise<{ data: (Workspace & { role: WorkspaceRole })[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return { data: null, error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('workspace_members')
      .select('role, workspaces (*)')
      .eq('profile_id', user.id);

    if (error) return { data: null, error: error.message };

    const workspaces = (data as any[]).map(item => ({
      ...item.workspaces,
      role: item.role as WorkspaceRole
    }));

    return { data: workspaces, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown error' };
  }
}

export async function getWorkspaceById(id: string): Promise<{ data: Workspace | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Workspace, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown error' };
  }
}

export async function getWorkspaceMembers(id: string): Promise<{ data: WorkspaceMemberWithProfile[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('workspace_members')
      .select('*, profile:profiles(full_name, avatar_url)')
      .eq('workspace_id', id);

    if (error) return { data: null, error: error.message };
    return { data: data as unknown as WorkspaceMemberWithProfile[], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown error' };
  }
}

export async function updateMemberRole(workspaceId: string, profileId: string, role: WorkspaceRole): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    // Using any cast on the payload to bypass strict type check for custom unions
    const { error } = await supabase
      .from('workspace_members')
      .update({ role } as any)
      .eq('workspace_id', workspaceId)
      .eq('profile_id', profileId);

    return { error: error?.message || null };
  } catch (err: any) {
    return { error: err.message || 'Unknown error' };
  }
}

export async function removeMember(workspaceId: string, profileId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('profile_id', profileId);

    return { error: error?.message || null };
  } catch (err: any) {
    return { error: err.message || 'Unknown error' };
  }
}

export async function getInvitations(workspaceId: string): Promise<{ data: Invitation[] | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending');

    if (error) return { data: null, error: error.message };
    return { data: data as Invitation[], error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown error' };
  }
}

export async function inviteMember(workspaceId: string, email: string, role: WorkspaceRole, invitedBy: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    const { error } = await supabase
      .from('invitations')
      .insert({
        workspace_id: workspaceId,
        email,
        role,
        token,
        invited_by: invitedBy,
        expires_at: expiresAt.toISOString(),
        status: 'pending'
      } as any);

    return { error: error?.message || null };
  } catch (err: any) {
    return { error: err.message || 'Unknown error' };
  }
}

export async function revokeInvitation(invitationId: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId);

    return { error: error?.message || null };
  } catch (err: any) {
    return { error: err.message || 'Unknown error' };
  }
}

export async function getInvitationByToken(token: string): Promise<{ data: (Invitation & { workspaces: { name: string } }) | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('invitations')
      .select('*, workspaces(name)')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as any, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown error' };
  }
}

export async function acceptInvitation(invitationId: string, workspaceId: string, profileId: string, role: WorkspaceRole): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    
    // 1. Mark invitation as accepted
    const { error: inviteError } = await supabase
      .from('invitations')
      .update({ status: 'accepted' } as any)
      .eq('id', invitationId);

    if (inviteError) return { error: inviteError.message };

    // 2. Add to workspace_members
    const { error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        profile_id: profileId,
        role
      } as any);

    return { error: memberError?.message || null };
  } catch (err: any) {
    return { error: err.message || 'Unknown error' };
  }
}
