import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { User } from '../../models/user.model';

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

  list(params: QueryParams = {}) {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof QueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<User[]>(`${this.base}/users`, { 
      params: httpParams,
      withCredentials: true 
    });
  }

  get(id: string, include_deleted: boolean = false) {
    let httpParams = new HttpParams();
    if (include_deleted) {
      httpParams = httpParams.set('include_deleted', 'true');
    }
    
    return this.http.get<User>(`${this.base}/users/${id}`, { 
      params: httpParams,
      withCredentials: true 
    });
  }

  create(payload: { name: string; email: string; password: string; is_admin: boolean; active: boolean; }) {
    return this.http.post<User>(`${this.base}/users`, payload, { withCredentials: true });
  }

  update(id: string, patch: Partial<User>) {
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
}