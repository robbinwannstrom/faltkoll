/**
 * Registry for projects joined via group codes.
 * Ensures that whenever a student or user joins a project with a code,
 * the project is permanently remembered and displayed in their project list.
 */

export function getJoinedProjectIds(userId?: string | null): string[] {
  if (!userId) {
    try {
      const raw = localStorage.getItem('faltkoll_joined_projects_default');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
  try {
    const raw = localStorage.getItem(`faltkoll_joined_projects_${userId}`);
    const globalRaw = localStorage.getItem('faltkoll_joined_projects_default');
    const userList: string[] = raw ? JSON.parse(raw) : [];
    const guestList: string[] = globalRaw ? JSON.parse(globalRaw) : [];
    return Array.from(new Set([...userList, ...guestList]));
  } catch {
    return [];
  }
}

export function addJoinedProjectId(userId: string | null | undefined, projectId: string): void {
  if (!projectId) return;
  const key = userId ? `faltkoll_joined_projects_${userId}` : 'faltkoll_joined_projects_default';
  try {
    const current = getJoinedProjectIds(userId);
    if (!current.includes(projectId)) {
      current.push(projectId);
      localStorage.setItem(key, JSON.stringify(current));
    }
  } catch {}
}

export function isProjectJoinedByUser(userId: string | null | undefined, projectId: string): boolean {
  if (!projectId) return false;
  return getJoinedProjectIds(userId).includes(projectId);
}
