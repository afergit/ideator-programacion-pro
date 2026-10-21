export type ProjectStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type AccessLevel = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerName: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  accessLevel: AccessLevel;
}

export interface ProjectPayload {
  name: string;
  description?: string;
  status?: ProjectStatus;
}
