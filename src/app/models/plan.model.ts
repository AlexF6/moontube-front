export interface PlanList {
  id: string;
  name: string;
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
  price: string;
  max_profiles: number;
  max_devices: number;
  video_quality: string;
}

export interface PlanCreate {
  name: string;
  price: number;
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