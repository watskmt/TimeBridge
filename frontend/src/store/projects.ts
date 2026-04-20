import { create } from 'zustand';
import { Project, CreateProjectRequest, ProjectSummary } from '@/types';
import { apiClient } from '@/api/client.ts';

interface ProjectsState {
  // State
  projects: Project[];
  selectedProject: Project | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  fetchProject: (id: number) => Promise<Project>;
  createProject: (request: CreateProjectRequest) => Promise<Project>;
  updateProject: (id: number, updates: Partial<CreateProjectRequest>) => Promise<Project>;
  deleteProject: (id: number) => Promise<void>;
  getProjectSummary: (id: number) => Promise<ProjectSummary>;
  setSelectedProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<{ data: Project[] }>('/projects');
      set({ projects: data.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch projects';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchProject: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<Project>(`/projects/${id}`);
      set({ selectedProject: data, isLoading: false });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch project';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createProject: async (request: CreateProjectRequest) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<{ project: Project }>('/projects', request);
      set((state) => ({
        projects: [...state.projects, data.project],
        isLoading: false,
      }));
      return data.project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create project';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateProject: async (id: number, updates: Partial<CreateProjectRequest>) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.put<{ project: Project }>(`/projects/${id}`, updates);
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? data.project : p)),
        selectedProject: state.selectedProject?.id === id ? data.project : state.selectedProject,
        isLoading: false,
      }));
      return data.project;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update project';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteProject: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        selectedProject: state.selectedProject?.id === id ? null : state.selectedProject,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete project';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getProjectSummary: async (id: number) => {
    try {
      const { data } = await apiClient.get<ProjectSummary>(`/projects/${id}/summary`);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch project summary';
      set({ error: message });
      throw error;
    }
  },

  setSelectedProject: (project: Project | null) => {
    set({ selectedProject: project });
  },

  clearError: () => {
    set({ error: null });
  },
}));
