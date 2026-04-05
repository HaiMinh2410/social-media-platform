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
