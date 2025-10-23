import type { User } from './user.model';
import type { Plan } from './plan.model';

export type SubscriptionStatus = 'ACTIVE' | 'CANCELED' | 'PAST_DUE';

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: string;
  end_date: string;
  renews_at: string;
  canceled_at: string | null;
  user?: User;
  plan?: Plan;
};