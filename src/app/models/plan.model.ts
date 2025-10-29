export interface PlanList {
  id: string;
  name: string;
  // API returns Decimal as string
  price: string;
  max_profiles: number;
  max_devices: number;
  video_quality: string;
}

export interface Plan {
  id: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
  name: string;
  price: string; // Decimal string
  max_profiles: number;
  max_devices: number;
  video_quality: string;
}

export interface PlanCreate {
  name: string;
  price: number; // send number; backend accepts Decimal
  max_profiles: number;
  max_devices: number;
  video_quality: string;
}

export interface PlanUpdate {
  name?: string;
  price?: number;
  max_profiles?: number;
  max_devices?: number;
  video_quality?: string;
}

export interface PlanSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'EXPIRED';
  start_date: string;
  end_date: string;
  renews_at: string;
  canceled_at: string | null;
}

export interface PlanQueryParams {
  q?: string;
  min_price?: number | null;
  max_price?: number | null;
  video_quality?: string | null;
  order_by?: 'created_at' | 'name' | 'price';
  order_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}
