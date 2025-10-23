export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export type Payment = {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paid_at: string | null;
  provider: string | null;
  external_id: string | null;
};