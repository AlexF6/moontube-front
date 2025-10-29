import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type {
  Plan,
  PlanList,
  PlanCreate,
  PlanUpdate,
  PlanSubscription,
  PlanQueryParams,
} from '../../models/plan.model';

@Injectable({ providedIn: 'root' })
export class PlansService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private toParams(obj: Record<string, unknown> | PlanQueryParams) {
    let p = new HttpParams();
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        p = p.set(k, String(v));
      }
    });
    return p;
  }

  // ---------- Admin endpoints ----------
  list(params: PlanQueryParams = {}) {
    const httpParams = this.toParams(params);
    return this.http.get<PlanList[]>(`${this.base}/plans`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  get(id: string) {
    return this.http.get<Plan>(`${this.base}/plans/${id}`, {
      withCredentials: true,
    });
  }

  create(payload: PlanCreate) {
    return this.http.post<Plan>(`${this.base}/plans`, payload, {
      withCredentials: true,
    });
  }

  update(id: string, patch: PlanUpdate) {
    return this.http.put<Plan>(`${this.base}/plans/${id}`, patch, {
      withCredentials: true,
    });
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/plans/${id}`, {
      withCredentials: true,
    });
  }

  getPlanSubscriptions(planId: string, limit: number = 50, offset: number = 0) {
    const params = new HttpParams()
      .set('limit', String(limit))
      .set('offset', String(offset));
    return this.http.get<PlanSubscription[]>(
      `${this.base}/plans/${planId}/subscriptions`,
      { params, withCredentials: true }
    );
  }

  // ---------- Self-service (/me/plans) - optional helpers ----------
  listMe(params: PlanQueryParams = {}) {
    const httpParams = this.toParams(params);
    return this.http.get<PlanList[]>(`${this.base}/me/plans`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  getMe(id: string) {
    return this.http.get<Plan>(`${this.base}/me/plans/${id}`, {
      withCredentials: true,
    });
  }
}
