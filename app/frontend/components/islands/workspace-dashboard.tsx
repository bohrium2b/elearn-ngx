// Re-export from the new workspace directory for backward compatibility
import WorkspaceDashboard from "../workspace/WorkspaceDashboard";
export type { WorkspaceProps, QuestionNode, TagNode, DragPayload, WorkspaceState } from "../workspace/types";
export const tagName = 'workspace-dashboard';

export default WorkspaceDashboard;