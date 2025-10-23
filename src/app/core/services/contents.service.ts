import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Content } from '../../models/content.model';

@Injectable({ providedIn: 'root' })
export class ContentsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list() { return this.http.get<Content[]>(`${this.base}/contents`, { withCredentials: true }); }
  create(payload: Partial<Content>) { return this.http.post<Content>(`${this.base}/contents`, payload, { withCredentials: true }); }
  delete(id: string) { return this.http.delete<void>(`${this.base}/contents/${id}`, { withCredentials: true }); }
}