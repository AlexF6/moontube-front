import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Profile } from '../../models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list() { return this.http.get<Profile[]>(`${this.base}/profiles`, { withCredentials: true }); }
  create(payload: Partial<Profile>) { return this.http.post<Profile>(`${this.base}/profiles`, payload, { withCredentials: true }); }
  delete(id: string) { return this.http.delete<void>(`${this.base}/profiles/${id}`, { withCredentials: true }); }
}