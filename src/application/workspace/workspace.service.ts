import { WorkspaceRole, Invitation, WorkspaceMemberWithProfile } from '@/domain/types/workspace';
import * as workspaceRepo from '@/infrastructure/database/repositories/workspace.repository';
import { createClient } from '@/lib/supabase/server';

export async function inviteMember(workspaceId: string, email: string, role: WorkspaceRole): Promise<{ data: Invitation | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return { data: null, error: 'Unauthorized' };

    // Check if member already exists
    const { data: members } = await workspaceRepo.getWorkspaceMembers(workspaceId);
    // Ideally we'd check by email here but profiles don't have emails. 
    // For now we'll rely on the DB to handle existing invitations/members if they were to have email.
    
    // Generate a unique token
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Invitation expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return workspaceRepo.createInvitation({
      workspace_id: workspaceId,
      email,
      role,
      token,
      invited_by: user.id,
      expires_at: expiresAt.toISOString()
    });
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to invite member' };
  }
}

export async function getTeamContext(workspaceId: string): Promise<{ 
  data: { members: WorkspaceMemberWithProfile[], invitations: Invitation[] } | null; 
  error: string | null 
}> {
  const [membersResult, invitationsResult] = await Promise.all([
    workspaceRepo.getWorkspaceMembers(workspaceId),
    workspaceRepo.getInvitations(workspaceId)
  ]);

  if (membersResult.error) return { data: null, error: membersResult.error };
  if (invitationsResult.error) return { data: null, error: invitationsResult.error };

  return {
    data: {
      members: membersResult.data || [],
      invitations: invitationsResult.data || []
    },
    error: null
  };
}

export async function updateRole(workspaceId: string, profileId: string, role: WorkspaceRole) {
  return workspaceRepo.updateMemberRole(workspaceId, profileId, role);
}

export async function removeMember(workspaceId: string, profileId: string) {
  return workspaceRepo.removeMember(workspaceId, profileId);
}

export async function revokeInvitation(invitationId: string) {
  return workspaceRepo.revokeInvitation(invitationId);
}

export async function getInvitationByToken(token: string) {
  return workspaceRepo.getInvitationByToken(token);
}

export async function acceptInvitation(invitationId: string, workspaceId: string, profileId: string, role: WorkspaceRole) {
  return workspaceRepo.acceptInvitation(invitationId, workspaceId, profileId, role);
}
