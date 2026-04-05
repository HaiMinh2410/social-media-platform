import { createClient } from '@/lib/supabase/server';
import { Workspace, WorkspaceMember, WorkspaceMemberWithProfile, Invitation, WorkspaceRole } from '@/domain/types/workspace';
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
    const { error } = await supabase
      .from('workspace_members')
      .update({ role })
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

export async function createInvitation(invitation: Omit<Invitation, 'id' | 'created_at' | 'status'>): Promise<{ data: Invitation | null; error: string | null }> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('invitations')
      .insert({
        workspace_id: invitation.workspace_id,
        email: invitation.email,
        role: invitation.role,
        token: invitation.token,
        invited_by: invitation.invited_by,
        expires_at: invitation.expires_at,
        status: 'pending'
      } as Database['public']['Tables']['invitations']['Insert'])
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data: data as Invitation, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown error' };
  }
}

export async function revokeInvitation(id: string): Promise<{ error: string | null }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'revoked' })
      .eq('id', id);

    return { error: error?.message || null };
  } catch (err: any) {
    return { error: err.message || 'Unknown error' };
  }
}
