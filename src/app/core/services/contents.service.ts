// src/app/core/services/contents.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Content, ContentList, ContentCreate, ContentUpdate } from '../../models/content.model';

interface QueryParams {
  q?: string;
  type_q?: 'MOVIE' | 'SERIES' | 'VIDEOS' | null;
  genre_q?: string;
  year_from?: number | null;
  year_to?: number | null;
  min_duration?: number | null;
  max_duration?: number | null;
  age_rating?: string | null;
  order_by?: 'created_at' | 'title' | 'release_year';
  order_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class ContentsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getContents(params: QueryParams) {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof QueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<ContentList[]>(`${this.base}/contents`, { 
      params: httpParams,
      withCredentials: true 
    });
  }

  getContent(id: string) {
    return this.http.get<Content>(`${this.base}/contents/${id}`, { 
      withCredentials: true 
    });
  }

  createContent(payload: ContentCreate) {
    return this.http.post<Content>(`${this.base}/contents`, payload, { 
      withCredentials: true 
    });
  }

  updateContent(id: string, patch: ContentUpdate) {
    return this.http.put<Content>(`${this.base}/contents/${id}`, patch, { 
      withCredentials: true 
    });
  }

  deleteContent(id: string) {
    return this.http.delete<void>(`${this.base}/contents/${id}`, { 
      withCredentials: true 
    });
  }
}