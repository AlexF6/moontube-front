// src/app/core/services/contents.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Content, ContentList, ContentCreate, ContentUpdate } from '../../models/content.model';
import { catchError, throwError } from 'rxjs';

interface QueryParams {
  q?: string;
  type_q?: 'MOVIE' | 'SERIES' | 'VIDEOS' | null;
  genre_q?: string;
  year_from?: number | null;
  year_to?: number | null;
  min_duration_seconds?: number | null;
  max_duration_seconds?: number | null;
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

    Object.keys(params).forEach((key) => {
      const value = params[key as keyof QueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<ContentList[]>(`${this.base}/contents`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  getContent(id: string) {
    return this.http.get<Content>(`${this.base}/contents/${id}`, {
      withCredentials: true,
    });
  }

  createContent(payload: ContentCreate) {
    return this.http.post<Content>(`${this.base}/contents`, payload, {
      withCredentials: true,
    });
  }

  updateContent(id: string, patch: ContentUpdate) {
    return this.http.put<Content>(`${this.base}/contents/${id}`, patch, {
      withCredentials: true,
    });
  }

  deleteContent(id: string) {
    return this.http.delete<void>(`${this.base}/contents/${id}`, {
      withCredentials: true,
    });
  }

  // ---------- Public (no auth) ----------
  getPublicContents(params: QueryParams) {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const value = params[key as keyof QueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<ContentList[]>(`${this.base}/public/contents`, {
      params: httpParams,
    });
  }

  getPublicContent(id: string) {
    return this.http.get<Content>(`${this.base}/public/contents/${id}`);
  }

  // ---------- Smart (try admin, fallback to public) ----------
  getSmartContents(params: QueryParams) {
    return this.getContents(params).pipe(
      catchError((err) => {
        if (err?.status === 401 || err?.status === 403) {
          return this.getPublicContents(params);
        }
        return throwError(() => err);
      })
    );
  }

  getSmartContent(id: string) {
    return this.getContent(id).pipe(
      catchError((err) => {
        if (err?.status === 401 || err?.status === 403) {
          return this.getPublicContent(id);
        }
        return throwError(() => err);
      })
    );
  }

  getMyContent(id: string) {
    return this.http.get<Content>(`${this.base}/me/contents/${id}`, {
      withCredentials: true,
    });
  }

  /** (Opcional) GET /me/contents - si más adelante lo usas para listados */
  getMyContents(params: {
    q?: string | null;
    type_q?: 'MOVIE' | 'SERIES' | 'VIDEOS' | null;
    limit?: number | null;
    offset?: number | null;
  } = {}) {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        httpParams = httpParams.set(k, String(v));
      }
    });
    return this.http.get<Content[]>(`${this.base}/me/contents`, {
      params: httpParams,
      withCredentials: true,
    });
  }

}
