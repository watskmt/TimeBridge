import { create } from 'zustand';
import { Invoice, CreateInvoiceRequest } from '@/types';
import { apiClient } from '@/api/client.ts';

interface InvoicesState {
  invoices: Invoice[];
  selectedInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;

  fetchInvoices: (filters?: { status?: string; year?: number; month?: number }) => Promise<void>;
  fetchInvoice: (id: number) => Promise<Invoice>;
  createInvoice: (request: CreateInvoiceRequest) => Promise<Invoice>;
  updateInvoice: (id: number, updates: Partial<CreateInvoiceRequest>) => Promise<Invoice>;
  deleteInvoice: (id: number) => Promise<void>;
  sendInvoice: (id: number) => Promise<Invoice>;
  markPaid: (id: number) => Promise<Invoice>;
  setSelectedInvoice: (invoice: Invoice | null) => void;
  clearError: () => void;
}

export const useInvoicesStore = create<InvoicesState>((set) => ({
  invoices: [],
  selectedInvoice: null,
  isLoading: false,
  error: null,

  fetchInvoices: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<{ data: Invoice[] }>('/invoices', { params: filters });
      set({ invoices: data.data, isLoading: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch invoices';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchInvoice: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.get<Invoice>(`/invoices/${id}`);
      set({ selectedInvoice: data, isLoading: false });
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch invoice';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  createInvoice: async (request: CreateInvoiceRequest) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<{ invoice: Invoice }>('/invoices', request);
      set((state) => ({
        invoices: [data.invoice, ...state.invoices],
        isLoading: false,
      }));
      return data.invoice;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create invoice';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateInvoice: async (id: number, updates: Partial<CreateInvoiceRequest>) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.put<{ invoice: Invoice }>(`/invoices/${id}`, updates);
      set((state) => ({
        invoices: state.invoices.map((inv) => (inv.id === id ? data.invoice : inv)),
        selectedInvoice: state.selectedInvoice?.id === id ? data.invoice : state.selectedInvoice,
        isLoading: false,
      }));
      return data.invoice;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update invoice';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteInvoice: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/invoices/${id}`);
      set((state) => ({
        invoices: state.invoices.filter((inv) => inv.id !== id),
        selectedInvoice: state.selectedInvoice?.id === id ? null : state.selectedInvoice,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete invoice';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  sendInvoice: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post<{ invoice: Invoice }>(`/invoices/${id}/send`);
      set((state) => ({
        invoices: state.invoices.map((inv) => (inv.id === id ? data.invoice : inv)),
        selectedInvoice: state.selectedInvoice?.id === id ? data.invoice : state.selectedInvoice,
        isLoading: false,
      }));
      return data.invoice;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send invoice';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  markPaid: async (id: number) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.put<{ invoice: Invoice }>(`/invoices/${id}/mark-paid`);
      set((state) => ({
        invoices: state.invoices.map((inv) => (inv.id === id ? data.invoice : inv)),
        selectedInvoice: state.selectedInvoice?.id === id ? data.invoice : state.selectedInvoice,
        isLoading: false,
      }));
      return data.invoice;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to mark invoice as paid';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  setSelectedInvoice: (invoice: Invoice | null) => {
    set({ selectedInvoice: invoice });
  },

  clearError: () => {
    set({ error: null });
  },
}));
