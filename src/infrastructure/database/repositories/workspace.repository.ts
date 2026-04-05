import { createClient } from '@/lib/supabase/server';
import { Workspace, WorkspaceMember } from '@/domain/types/workspace';

export async function getMyWorkspaces(): Promise<{ data: (Workspace & { role: string })[] | null; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) return { data: null, error: 'Unauthorized' };

    const { data, error } = await supabase
      .from('workspace_members')
      .select('role, workspaces (*)')
      .eq('profile_id', user.id);

    if (error) return { data: null, error: error.message };

    const workspaces = (data as any[]).map(item => ({
      ...item.workspaces,
      role: item.role
    }));

    return { data: workspaces, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unknown error' };
  }
}

export async function getWorkspaceById(id: string): Promise<{ data: Workspace | null; error: string | null }> {
  try {
    const supabase = await createClient();
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
