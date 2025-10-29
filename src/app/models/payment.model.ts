// src/app/models/payment.model.ts
export interface Payment {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;                 
  currency: string;
  status: PaymentStatus;
  provider: string | null;        
  external_id: string | null;     
  paid_at: string | null;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;

  subscription_name?: string | null;
  plan_name?: string | null;
}

export interface PaymentCreate {
  user_id: string;
  subscription_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  external_id: string;
  paid_at?: string | null;
}

export interface PaymentUpdate {
  amount?: number;
  currency?: string;
  status?: PaymentStatus;
  provider?: string;
  external_id?: string;
  paid_at?: string | null;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export interface PaymentQuery {
  user_id?: string | null;
  subscription_id?: string | null;
  status_q?: PaymentStatus | null;
  provider?: string | null;
  external_id?: string | null;
  created_from?: string | null;
  created_to?: string | null;
  paid_from?: string | null;
  paid_to?: string | null;
  amount_min?: number | null;
  amount_max?: number | null;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export type PaginatedPayments = {
  payments: Payment[];
  total: number;
  has_more: boolean;
};
