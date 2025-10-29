export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELED = 'CANCELED',
  PAST_DUE = 'PAST_DUE',
}

// Lo que devuelve el backend (SubscriptionOut)
export interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string | null;   // puede venir null si DB default
  end_date: string | null;
  renews_at: string | null;
  canceled_at: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Para listados ligeros (SubscriptionListItem). Puedes usar Subscription si prefieres.
export interface SubscriptionListItem {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string | null;
  end_date: string | null;
  renews_at: string | null;
  canceled_at: string | null;
}

// ADMIN: crear suscripción para cualquier usuario
export interface SubscriptionCreateAdmin {
  user_id: string;
  plan_id: string;
  status?: SubscriptionStatus;   // por defecto ACTIVE en backend
  start_date?: string | null;
  end_date?: string | null;
  renews_at?: string | null;
}

// SELF-SERVICE: crear mi suscripción
export interface SubscriptionCreateMe {
  plan_id: string;
  start_date?: string | null;
  end_date?: string | null;
  renews_at?: string | null;
}

// ADMIN: actualizar suscripción
export interface SubscriptionUpdateAdmin {
  plan_id?: string;
  status?: SubscriptionStatus;
  end_date?: string | null;
  renews_at?: string | null;
  canceled_at?: string | null;
}

// SELF-SERVICE: cambiar plan
export interface SwitchPlanIn {
  plan_id: string;
  effective_end?: string | null; // fin de ciclo actual (opcional)
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
