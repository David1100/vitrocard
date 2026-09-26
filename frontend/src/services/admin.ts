import { api } from './api';

export interface Customer {
  id: string;
  document: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  status: 'ACTIVE' | 'INACTIVE' | string;
  createdAt: string;
  visits?: number;
  rewardsAvailable?: number;
}

export interface PaginatedList<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
}

export interface Salon {
  id: string;
  name: string;
  slug: string;
  qrCode: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  createdAt: string;
}

export interface CustomerInput {
  document: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}

export interface SalonInput {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export interface Visit {
  id: string;
  status: 'VALIDA' | 'ANULADA';
  createdAt: string;
  cancelledBy: string | null;
  customer: { id: string; document: string; firstName: string; lastName: string | null };
  salon: { id: string; name: string };
}

export interface VisitRegistration {
  visit: { id: string; createdAt: string; status: string; rewardGenerated: boolean };
  salonName: string;
  totalVisits: number;
  requiredVisits: number;
  rewardGenerated: boolean;
}

export interface LoyaltyProgram {
  id: string;
  name: string;
  requiredVisits: number;
  isActive: boolean;
}

export const visitsService = {
  list: (search?: string, page = 1) =>
    api<PaginatedList<Visit>>(`/visits?page=${page}&perPage=20${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  create: (document: string, salonId: string) =>
    api<VisitRegistration>('/visits/create', { method: 'POST', body: { document, salonId } }),
  cancel: (id: string) => api<void>(`/visits/${id}/cancel`, { method: 'PATCH' }),
};

export const loyaltyService = {
  config: () => api<LoyaltyProgram>('/loyalty/config'),
  update: (requiredVisits: number) =>
    api<{ program: LoyaltyProgram }>('/loyalty/config', { method: 'PATCH', body: { requiredVisits } }),
};

export interface AvailableReward {
  id: string;
  earnedAt: string;
  rewardName: string;
  rewardDescription: string | null;
  requiredVisits: number;
  salonName: string;
}

export interface CustomerRewardsLookup {
  customer: { id: string; firstName: string; lastName: string | null };
  rewards: AvailableReward[];
}

export interface RedemptionResult {
  id: string;
  status: string;
  redeemedAt: string;
  rewardName: string;
  salonName: string;
  customerName: string;
}

export const rewardsService = {
  byDocument: (document: string) =>
    api<CustomerRewardsLookup>(`/rewards/customer/${encodeURIComponent(document)}`),
  redeem: (id: string, salonId: string) =>
    api<RedemptionResult>(`/rewards/${id}/redeem`, { method: 'POST', body: { salonId } }),
};

export interface DashboardStats {
  activeSalons: number;
  activeCustomers: number;
  totalVisits: number;
  visitsToday: number;
  visitsLast7: number;
  visitsByDay: { date: string; count: number }[];
  visitsBySalon: { salonName: string; count: number }[];
  rewardsByStatus: { status: string; count: number }[];
}

export const dashboardService = {
  stats: () => api<DashboardStats>('/dashboard/stats'),
};

export const customersService = {
  list: (search?: string, page = 1) =>
    api<PaginatedList<Customer>>(`/customers?page=${page}&perPage=20${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  create: (input: CustomerInput) =>
    api<{ customer: Customer }>('/customers/create', { method: 'POST', body: input }),
  setStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    api<void>(`/customers/${id}`, { method: 'PATCH', body: { status } }),
};

export const salonsService = {
  list: (search?: string, page = 1) =>
    api<PaginatedList<Salon>>(`/salons?page=${page}&perPage=20${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  /** Público y anónimo: nombre del salón a partir del código QR. */
  byQrCode: (code: string) => api<{ name: string }>(`/salons/qr/${encodeURIComponent(code)}`),
  create: (input: SalonInput) =>
    api<{ salon: Salon }>('/salons/create', { method: 'POST', body: input }),
  setStatus: (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    api<void>(`/salons/${id}`, { method: 'PATCH', body: { status } }),
};
