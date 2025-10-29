// src/app/core/services/users.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { User, UserAdminCreate, UserAdminUpdate, UserMeUpdate, PasswordChange } from '../../models/user.model';

interface QueryParams {
  limit?: number;
  offset?: number;
  q?: string | null;
  include_deleted?: boolean;
  only_active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  private toParams(obj: QueryParams) {
    let p = new HttpParams();
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        p = p.set(k, String(v));
      }
    });
    return p;
  }

  // ------------ Admin endpoints ------------
  list(params: QueryParams = {}) {
    const httpParams = this.toParams(params);
    return this.http.get<User[]>(`${this.base}/users`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  get(id: string, include_deleted = false) {
    const httpParams = this.toParams(include_deleted ? { include_deleted: true } : {});
    return this.http.get<User>(`${this.base}/users/${id}`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  create(payload: UserAdminCreate) {
    return this.http.post<User>(`${this.base}/users`, payload, { withCredentials: true });
  }

  update(id: string, patch: UserAdminUpdate) {
    return this.http.put<User>(`${this.base}/users/${id}`, patch, { withCredentials: true });
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.base}/users/${id}`, { withCredentials: true });
  }

  restore(id: string) {
    return this.http.post<User>(`${this.base}/users/${id}/restore`, {}, { withCredentials: true });
  }

  setPassword(id: string, new_password: string) {
    return this.http.post<void>(`${this.base}/users/${id}/set-password`, { new_password }, { withCredentials: true });
  }

  // ------------ Self-service (/me/users) ------------
  getMe() {
    return this.http.get<User>(`${this.base}/me/users`, { withCredentials: true });
  }

  updateMe(patch: UserMeUpdate) {
    // server ignores active/is_admin even if mistakenly sent; we keep DTO strict
    return this.http.put<User>(`${this.base}/me/users`, patch, { withCredentials: true });
  }

  changeMyPassword(dto: PasswordChange) {
    return this.http.post<void>(`${this.base}/me/users/change-password`, dto, { withCredentials: true });
  }
}
