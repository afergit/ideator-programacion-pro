export type ProjectPhase = 
  | 'PHASE_A_PROBLEM'
  | 'PHASE_B_DATABASE'
  | 'PHASE_C_API'
  | 'PHASE_D_FRONTEND'
  | 'PHASE_E_ARCHITECTURE';

export type PhaseStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED';

export interface Project {
  id: string;
  name: string;
  description: string;
  currentPhase: ProjectPhase;
  createdAt: string;
  updatedAt: string;
  isPrivate: boolean;
  ownerId: string;
  collaborators: string[]; // User IDs
  phaseProgress: Record<ProjectPhase, PhaseStatus>;
}
