'use server';

import { revalidatePath } from 'next/cache';
import * as workspaceService from '@/application/workspace/workspace.service';
import { WorkspaceRole } from '@/domain/types/workspace';
import { z } from 'zod';

const InviteSchema = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'manager', 'agent', 'viewer']) as z.ZodType<WorkspaceRole>
});

export async function inviteMemberAction(formData: FormData) {
  const result = InviteSchema.safeParse({
    workspaceId: formData.get('workspaceId'),
    email: formData.get('email'),
    role: formData.get('role')
  });

  if (!result.success) {
    return { error: 'Dữ liệu không hợp lệ: ' + result.error.errors[0].message };
  }

  const { error } = await workspaceService.inviteMember(result.data.workspaceId, result.data.email, result.data.role);
  
  if (!error) {
    revalidatePath('/settings/members');
    return { success: true };
  }

  return { error };
}

export async function updateMemberRoleAction(workspaceId: string, profileId: string, role: WorkspaceRole) {
  const { error } = await workspaceService.updateRole(workspaceId, profileId, role);
  if (!error) revalidatePath('/settings/members');
  return { error };
}

export async function removeMemberAction(workspaceId: string, profileId: string) {
  const { error } = await workspaceService.removeMember(workspaceId, profileId);
  if (!error) revalidatePath('/settings/members');
  return { error };
}

export async function revokeInvitationAction(invitationId: string) {
  const { error } = await workspaceService.revokeInvitation(invitationId);
  if (!error) revalidatePath('/settings/members');
  return { error };
}
