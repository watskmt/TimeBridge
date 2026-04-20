import { create } from 'zustand';
import { TimeEntry, CreateTimeEntryRequest, TimeSummary } from '@/types';
import { apiClient } from '@/api/client.ts';

interface TimeEntriesState {
  // State
  entries: TimeEntry[];
  isLoading: boolean;
  error: string | null;
  currentTimer: {
    projectId: number | null;
    startTime: number | null;
    elapsedSeconds: number;
  };

  // Actions
  fetchTimeEntries: (filters?: {
    start_date?: string;
    end_date?: string;
    project_id?: number;
  }) => Promise<void>;
  createTimeEntry: (request: CreateTimeEntryRequest) => Promise<TimeEntry>;
  updateTimeEntry: (id: number, updates: Partial<CreateTimeEntryRequest>) => Promise<TimeEntry>;
  deleteTimeEntry: (id: number) => Promise<void>;
  getTimeSummary: (period: 'daily' | 'weekly' | 'monthly', params?: Record<string, unknown>) => Promise<TimeSummary>;
  getProjectReport: (projectId: number) => Promise<unknown>;

  // Timer actions
  startTimer: (projectId: number) => void;
  stopTimer: () => void;
  resetTimer: () => void;
  updateTimerSeconds: (seconds: number) => void;

  clearError: () => void;
}

export const useTimeEntriesStore = create<TimeEntriesState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,
  currentTimer: {
    projectId: null,
    startTime: null,
    elapsedSeconds: 0,
  },

  fetchTimeEntries: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<{ data: TimeEntry[] }>('/time-entries', { params: filters });
      set({ entries: data.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch time entries';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createTimeEntry: async (request: CreateTimeEntryRequest) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<{ time_entry: TimeEntry }>('/time-entries', request);
      set((state) => ({
        entries: [...state.entries, data.time_entry],
        isLoading: false,
      }));
      return data.time_entry;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create time entry';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateTimeEntry: async (id: number, updates: Partial<CreateTimeEntryRequest>) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.put<{ time_entry: TimeEntry }>(`/time-entries/${id}`, updates);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? data.time_entry : e)),
        isLoading: false,
      }));
      return data.time_entry;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update time entry';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteTimeEntry: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/time-entries/${id}`);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete time entry';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  getTimeSummary: async (period: 'daily' | 'weekly' | 'monthly', params: Record<string, unknown> = {}) => {
    try {
      const { data } = await apiClient.get<TimeSummary>(`/time-entries/summary/${period}`, {
        params,
      });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch time summary';
      set({ error: message });
      throw error;
    }
  },

  getProjectReport: async (projectId: number) => {
    try {
      const { data } = await apiClient.get(`/time-entries/report/${projectId}`);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch project report';
      set({ error: message });
      throw error;
    }
  },

  startTimer: (projectId: number) => {
    set({
      currentTimer: {
        projectId,
        startTime: Date.now(),
        elapsedSeconds: 0,
      },
    });
  },

  stopTimer: () => {
    const state = get();
    if (state.currentTimer.startTime) {
      const elapsedMs = Date.now() - state.currentTimer.startTime;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      set({
        currentTimer: {
          ...state.currentTimer,
          elapsedSeconds: state.currentTimer.elapsedSeconds + elapsedSeconds,
          startTime: null,
        },
      });
    }
  },

  resetTimer: () => {
    set({
      currentTimer: {
        projectId: null,
        startTime: null,
        elapsedSeconds: 0,
      },
    });
  },

  updateTimerSeconds: (seconds: number) => {
    set((state) => ({
      currentTimer: {
        ...state.currentTimer,
        elapsedSeconds: seconds,
      },
    }));
  },

  clearError: () => {
    set({ error: null });
  },
}));
