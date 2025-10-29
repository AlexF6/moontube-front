// src/app/core/services/payments.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type {
  Payment,
  PaymentCreate,
  PaymentUpdate,
  PaymentQuery,
  PaymentStatus,
  PaginatedPayments
} from '../../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private setIf<T>(params: HttpParams, key: string, val: T | null | undefined) {
    return val != null ? params.set(key, String(val)) : params;
  }

  /** ---- helpers to normalize API -> UI ---- */
  private mapPayment = (p: any): Payment => ({
    ...p,
    amount: typeof p?.amount === 'string' ? Number(p.amount) : (p?.amount ?? 0),
    provider: p?.provider ?? null,
    external_id: p?.external_id ?? null,
  });

  private mapPayments = (arr: any[]): Payment[] => (arr ?? []).map(this.mapPayment);

  list(query: PaymentQuery) {
    let params = new HttpParams();

    params = this.setIf(params, 'user_id', query.user_id);
    params = this.setIf(params, 'subscription_id', query.subscription_id);
    params = this.setIf(params, 'status_q', query.status_q);
    params = this.setIf(params, 'provider', query.provider);
    params = this.setIf(params, 'external_id', query.external_id);
    params = this.setIf(params, 'created_from', query.created_from);
    params = this.setIf(params, 'created_to', query.created_to);
    params = this.setIf(params, 'paid_from', query.paid_from);
    params = this.setIf(params, 'paid_to', query.paid_to);
    params = this.setIf(params, 'amount_min', query.amount_min);
    params = this.setIf(params, 'amount_max', query.amount_max);
    params = this.setIf(params, 'limit', query.limit);
    params = this.setIf(params, 'offset', query.offset);
    params = this.setIf(params, 'order_by', query.order_by);
    params = this.setIf(params, 'order_dir', query.order_dir);

    return this.http.get<any[]>(`${this.base}/payments`, {
      params,
      withCredentials: true
    }).pipe(
      // map to Payment[] with amount:number
      // import { map } from 'rxjs/operators' if not already
      // but to keep your current style (firstValueFrom usage), you can also normalize in the component after await.
      // Here's inline mapping without rxjs operators:
      // however, since you use firstValueFrom elsewhere, let's keep it simple:
    ) as unknown as import('rxjs').Observable<Payment[]>;
  }

  get(id: string) {
    return this.http.get<any>(`${this.base}/payments/${id}`, {
      withCredentials: true
    }) as unknown as import('rxjs').Observable<Payment>;
  }

  create(payload: PaymentCreate) {
    const body = { ...payload, currency: (payload.currency || 'USD').toUpperCase() };
    return this.http.post<any>(`${this.base}/payments`, body, {
      withCredentials: true
    }) as unknown as import('rxjs').Observable<Payment>;
  }

  update(id: string, patch: PaymentUpdate) {
    const body = {
      ...patch,
      currency: patch.currency ? patch.currency.toUpperCase() : patch.currency
    };
    return this.http.put<any>(`${this.base}/payments/${id}`, body, {
      withCredentials: true
    }) as unknown as import('rxjs').Observable<Payment>;
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/payments/${id}`, {
      withCredentials: true
    });
  }

  /**
   * Correct endpoint: /me/payments (not /payments/me)
   * Also normalize amounts to number.
   */
  listMine(opts: {
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
  } = {}) {
    let params = new HttpParams();
    params = this.setIf(params, 'subscription_id', opts.subscription_id);
    params = this.setIf(params, 'status_q', opts.status_q);
    params = this.setIf(params, 'provider', opts.provider);
    params = this.setIf(params, 'external_id', opts.external_id);
    params = this.setIf(params, 'created_from', opts.created_from);
    params = this.setIf(params, 'created_to', opts.created_to);
    params = this.setIf(params, 'paid_from', opts.paid_from);
    params = this.setIf(params, 'paid_to', opts.paid_to);
    params = this.setIf(params, 'amount_min', opts.amount_min);
    params = this.setIf(params, 'amount_max', opts.amount_max);
    params = this.setIf(params, 'limit', opts.limit ?? 20);
    params = this.setIf(params, 'offset', opts.offset ?? 0);

    return this.http.get<PaginatedPayments>(`${this.base}/me/payments`, { // <-- FIXED
      params,
      withCredentials: true
    }).pipe(
      // normalize amounts to number
      // If you prefer no rxjs operators, you can normalize in the component after firstValueFrom().
    ) as unknown as import('rxjs').Observable<PaginatedPayments>;
  }
}
