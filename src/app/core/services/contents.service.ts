// src/app/core/services/contents.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Content, ContentList, ContentCreate, ContentUpdate } from '../../models/content.model';

interface QueryParams {
  q?: string;
  type_q?: 'MOVIE' | 'SERIES' | 'VIDEOS' | null; // Added VIDEOS
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

@Injectable({
  providedIn: 'root'
})
export class ContentsService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:8000/contents';

  getContents(params: QueryParams): Observable<ContentList[]> {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof QueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<ContentList[]>(this.baseUrl, { params: httpParams });
  }

  getContent(id: string): Observable<Content> {
    return this.http.get<Content>(`${this.baseUrl}/${id}`);
  }

  createContent(content: ContentCreate): Observable<Content> {
    return this.http.post<Content>(this.baseUrl, content);
  }

  updateContent(id: string, content: ContentUpdate): Observable<Content> {
    return this.http.put<Content>(`${this.baseUrl}/${id}`, content);
  }

  deleteContent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}