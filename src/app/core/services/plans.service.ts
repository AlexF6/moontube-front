// src/app/core/services/plans.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Plan, PlanList, PlanCreate, PlanUpdate, PlanSubscription } from '../../models/plan.model';

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

@Injectable({
  providedIn: 'root'
})
export class PlansService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/plans';

  getPlans(params: PlanQueryParams): Observable<PlanList[]> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof PlanQueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<PlanList[]>(this.baseUrl, { params: httpParams });
  }

  getPlan(id: string): Observable<Plan> {
    return this.http.get<Plan>(`${this.baseUrl}/${id}`);
  }

  createPlan(plan: PlanCreate): Observable<Plan> {
    return this.http.post<Plan>(this.baseUrl, plan);
  }

  updatePlan(id: string, plan: PlanUpdate): Observable<Plan> {
    return this.http.put<Plan>(`${this.baseUrl}/${id}`, plan);
  }

  deletePlan(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getPlanSubscriptions(planId: string, limit: number = 50, offset: number = 0): Observable<PlanSubscription[]> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<PlanSubscription[]>(`${this.baseUrl}/${planId}/subscriptions`, { params });
  }
}