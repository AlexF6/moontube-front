import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { User } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list() {
    return this.http.get<User[]>(`${this.base}/users`, { withCredentials: true });
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
}