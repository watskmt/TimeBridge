// ===== User Types =====
export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company_name?: string;
  tax_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  company_name?: string;
  phone?: string;
}

// ===== Project Types =====
export type ProjectStatus = 'planning' | 'in_progress' | 'inspection' | 'completed';

export interface Project {
  id: number;
  user_id: number;
  name: string;
  client_name: string;
  description?: string;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  budget_amount: number;
  hourly_rate: number;
  created_at: string;
  updated_at: string;
}

export interface ProjectSummary extends Project {
  total_hours: number;
  total_earnings: number;
  budget_remaining: number;
  progress_percentage: number;
  is_over_budget: boolean;
  time_entries_count: number;
}

export interface CreateProjectRequest {
  name: string;
  client_name: string;
  description?: string;
  status: ProjectStatus;
  start_date: string;
  end_date: string;
  budget_amount: number;
  hourly_rate: number;
}

// ===== Time Entry Types =====
export interface TimeEntry {
  id: number;
  user_id: number;
  project_id: number;
  duration_minutes: number;
  date: string;
  description?: string;
  started_at?: string;
  ended_at?: string;
  project?: Project;
  created_at: string;
  updated_at: string;
}

export interface CreateTimeEntryRequest {
  project_id: number;
  duration_minutes: number;
  date: string;
  description?: string;
  started_at?: string;
  ended_at?: string;
}

export interface TimeSummary {
  period: 'daily' | 'weekly' | 'monthly';
  total_hours: number;
  total_earnings: number;
  entries?: TimeEntry[];
  daily_summary?: DailySummary[];
}

export interface DailySummary {
  date: string;
  hours: number;
  earnings: number;
}

// ===== Invoice Types =====
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

export interface Invoice {
  id: number;
  user_id: number;
  project_ids: number[];
  invoice_number: string;
  status: InvoiceStatus;
  issued_at: string;
  due_at: string;
  subtotal: number;
  tax: number;
  total: number;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateInvoiceRequest {
  project_ids: number[];
  issued_at: string;
  due_at: string;
  notes?: string;
}

// ===== Inspection Types =====
export type InspectionStatus = 'pending' | 'in_review' | 'approved' | 'rejected';

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
}

export interface Inspection {
  id: number;
  project_id: number;
  user_id: number;
  status: InspectionStatus;
  checklist: ChecklistItem[];
  approved_at?: string;
  approved_by?: number;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionComment {
  id: number;
  inspection_id: number;
  user_id: number;
  comment: string;
  user?: User;
  created_at: string;
  updated_at: string;
}

// ===== Dashboard Types =====
export interface DashboardSummary {
  current_month_earnings: number;
  current_month_hours: number;
  last_month_earnings: number;
  last_month_hours: number;
  earnings_growth: number;
  total_unpaid: number;
  unpaid_invoices_count: number;
  active_projects: number;
  work_rate: number;
}

export interface ChartDataPoint {
  month?: string;
  month_name?: string;
  hours?: number;
  earnings?: number;
  name?: string;
  percentage?: number;
}

export interface ChartData {
  metric: 'sales' | 'hours' | 'projects';
  data: ChartDataPoint[];
  currency?: string;
  unit?: string;
  total?: number;
}

// ===== API Response Types =====
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
