export type WorkspaceRole = 'admin' | 'manager' | 'agent' | 'viewer';

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  profile_id: string;
  role: WorkspaceRole;
  joined_at: string;
};

export type WorkspaceMemberWithProfile = WorkspaceMember & {
  profile: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';

export type Invitation = {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  token: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  status: InvitationStatus;
};

