import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Plan } from '../../models/plan.model';

@Injectable({ providedIn: 'root' })
export class PlansService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list() { return this.http.get<Plan[]>(`${this.base}/plans`, { withCredentials: true }); }
  create(payload: Partial<Plan>) { return this.http.post<Plan>(`${this.base}/plans`, payload, { withCredentials: true }); }
  delete(id: string) { return this.http.delete<void>(`${this.base}/plans/${id}`, { withCredentials: true }); }
}