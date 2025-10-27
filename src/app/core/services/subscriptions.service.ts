// src/app/core/services/subscriptions.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { 
  Subscription,
  SubscriptionCreate,
  SubscriptionUpdate,
  SubscriptionQuery,
  SubscriptionStatus 
} from '../../models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(query: SubscriptionQuery = {}) {
    let params = new HttpParams();

    const limit = Math.min(query.limit ?? 50, 200);
    params = params.set('limit', String(limit));

    if (query.offset != null) params = params.set('offset', String(query.offset));
    if (query.user_id) params = params.set('user_id', query.user_id);
    if (query.plan_id) params = params.set('plan_id', query.plan_id);
    if (query.status_q) params = params.set('status_q', query.status_q);
    if (query.active_only !== undefined)
      params = params.set('active_only', String(query.active_only));
    if (query.start_from) params = params.set('start_from', query.start_from);
    if (query.start_to) params = params.set('start_to', query.start_to);
    if (query.order_by) params = params.set('order_by', query.order_by);
    if (query.order_dir) params = params.set('order_dir', query.order_dir);

    return this.http.get<Subscription[]>(`${this.base}/subscriptions`, {
      params,
      withCredentials: true,
    });
  }

  get(id: string) {
    return this.http.get<Subscription>(`${this.base}/subscriptions/${id}`, { 
      withCredentials: true 
    });
  }

  create(payload: SubscriptionCreate) {
    return this.http.post<Subscription>(`${this.base}/subscriptions`, payload, { 
      withCredentials: true 
    });
  }

  update(id: string, patch: SubscriptionUpdate) {
    return this.http.put<Subscription>(`${this.base}/subscriptions/${id}`, patch, { 
      withCredentials: true 
    });
  }

  cancel(id: string, effective_end?: string) {
    let params = new HttpParams();
    if (effective_end) params = params.set('effective_end', effective_end);
    
    return this.http.post<Subscription>(`${this.base}/subscriptions/${id}/cancel`, {}, { 
      params,
      withCredentials: true 
    });
  }

  reactivate(id: string, new_end_date?: string) {
    let params = new HttpParams();
    if (new_end_date) params = params.set('new_end_date', new_end_date);
    
    return this.http.post<Subscription>(`${this.base}/subscriptions/${id}/reactivate`, {}, { 
      params,
      withCredentials: true 
    });
  }

  getMySubscriptions(status?: SubscriptionStatus) {
  let params: any = {};
  if (status) params.status_q = status;
  return this.http.get<Subscription[]>(`${this.base}/me/subscriptions`, {
    params, withCredentials: true
  });
}

  getSubscriptionPayments(subscriptionId: string, limit: number = 50, offset: number = 0) {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<any[]>(`${this.base}/subscriptions/${subscriptionId}/payments`, { 
      params,
      withCredentials: true 
    });
  }

cancelMy(id: string) {
  return this.http.post<Subscription>(`${this.base}/me/subscriptions/${id}/cancel`, null, {
    withCredentials: true
  });
}

reactivateMy(id: string) {
  return this.http.post<Subscription>(`${this.base}/me/subscriptions/${id}/reactivate`, null, {
    withCredentials: true
  });
}
}