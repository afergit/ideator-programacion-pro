import { api } from '../lib/api';
import type { Project, ProjectPayload } from '../types/project';

export const projectService = {
  async list(): Promise<Project[]> {
    const { data } = await api.get<Project[]>('/v1/projects');
    return data;
  },

  async getById(id: string): Promise<Project> {
    const { data } = await api.get<Project>(`/v1/projects/${id}`);
    return data;
  },

  async create(payload: ProjectPayload): Promise<Project> {
    const { data } = await api.post<Project>('/v1/projects', payload);
    return data;
  },

  async update(id: string, payload: ProjectPayload): Promise<Project> {
    const { data } = await api.put<Project>(`/v1/projects/${id}`, payload);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/v1/projects/${id}`);
  },
};
