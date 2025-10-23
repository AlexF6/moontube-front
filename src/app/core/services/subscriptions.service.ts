import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Subscription } from '../../models/subscription.model';

@Injectable({ providedIn: 'root' })
export class SubscriptionsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list() { return this.http.get<Subscription[]>(`${this.base}/subscriptions`, { withCredentials: true }); }
  cancel(id: string) { return this.http.post<Subscription>(`${this.base}/subscriptions/${id}/cancel`, {}, { withCredentials: true }); }
}