// src/app/models/subscription.model.ts
export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  renews_at: string;
  canceled_at: string | null;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionCreate {
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  renews_at: string;
}

export interface SubscriptionUpdate {
  plan_id?: string;
  status?: SubscriptionStatus;
  end_date?: string;
  renews_at?: string;
  canceled_at?: string | null;
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE'
}

export interface SubscriptionQuery {
  user_id?: string | null;
  plan_id?: string | null;
  status_q?: SubscriptionStatus | null;
  active_only?: boolean;
  start_from?: string | null;
  start_to?: string | null;
  limit?: number;
  offset?: number;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}