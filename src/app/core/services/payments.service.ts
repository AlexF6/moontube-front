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

  list(query: PaymentQuery) {
    let params = new HttpParams();
    
    if (query.user_id) params = params.set('user_id', query.user_id);
    if (query.subscription_id) params = params.set('subscription_id', query.subscription_id);
    if (query.status_q) params = params.set('status_q', query.status_q);
    if (query.provider) params = params.set('provider', query.provider);
    if (query.external_id) params = params.set('external_id', query.external_id);
    if (query.created_from) params = params.set('created_from', query.created_from);
    if (query.created_to) params = params.set('created_to', query.created_to);
    if (query.paid_from) params = params.set('paid_from', query.paid_from);
    if (query.paid_to) params = params.set('paid_to', query.paid_to);
    if (query.amount_min) params = params.set('amount_min', query.amount_min.toString());
    if (query.amount_max) params = params.set('amount_max', query.amount_max.toString());
    if (query.limit) params = params.set('limit', query.limit.toString());
    if (query.offset) params = params.set('offset', query.offset.toString());
    if (query.order_by) params = params.set('order_by', query.order_by);
    if (query.order_dir) params = params.set('order_dir', query.order_dir);

    return this.http.get<Payment[]>(`${this.base}/payments`, { 
      params,
      withCredentials: true 
    });
  }

  get(id: string) {
    return this.http.get<Payment>(`${this.base}/payments/${id}`, { 
      withCredentials: true 
    });
  }

  create(payload: PaymentCreate) {
    return this.http.post<Payment>(`${this.base}/payments`, payload, { 
      withCredentials: true 
    });
  }

  update(id: string, patch: PaymentUpdate) {
    return this.http.put<Payment>(`${this.base}/payments/${id}`, patch, { 
      withCredentials: true 
    });
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/payments/${id}`, { 
      withCredentials: true 
    });
  }

  getMyPayments(status_q?: PaymentStatus, limit = 50, offset = 0) {
    let params = new HttpParams()
      .set('limit', String(limit))
      .set('offset', String(offset));

    if (status_q) params = params.set('status_q', status_q);

    // ✅ endpoint correcto según tu Swagger
    return this.http.get<Payment[]>(`${this.base}/payments/me`, {
      params,
      withCredentials: true
    });
  }
}