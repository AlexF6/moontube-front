// src/app/core/services/plans.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Plan, PlanList, PlanCreate, PlanUpdate, PlanSubscription } from '../../models/plan.model';

interface PlanQueryParams {
  q?: string;
  min_price?: number | null;
  max_price?: number | null;
  video_quality?: string | null;
  order_by?: 'created_at' | 'name' | 'price';
  order_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class PlansService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list(params: PlanQueryParams) {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof PlanQueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<PlanList[]>(`${this.base}/plans`, { 
      params: httpParams,
      withCredentials: true 
    });
  }

  get(id: string) {
    return this.http.get<Plan>(`${this.base}/plans/${id}`, { 
      withCredentials: true 
    });
  }

  create(payload: PlanCreate) {
    return this.http.post<Plan>(`${this.base}/plans`, payload, { 
      withCredentials: true 
    });
  }

  update(id: string, patch: PlanUpdate) {
    return this.http.put<Plan>(`${this.base}/plans/${id}`, patch, { 
      withCredentials: true 
    });
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/plans/${id}`, { 
      withCredentials: true 
    });
  }

  getPlanSubscriptions(planId: string, limit: number = 50, offset: number = 0) {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<PlanSubscription[]>(`${this.base}/plans/${planId}/subscriptions`, { 
      params,
      withCredentials: true 
    });
  }
}