// src/app/core/services/watchlist.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Watchlist, WatchlistList, WatchlistCreate, WatchlistUpdate } from '../../models/watchlist.model';

interface QueryParams {
  profile_id?: string | null;
  content_id?: string | null;
  added_from?: string | null;
  added_to?: string | null;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class WatchlistService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getWatchlists(params: QueryParams) {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof QueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<WatchlistList[]>(`${this.base}/watchlist`, { 
      params: httpParams,
      withCredentials: true 
    });
  }

  getWatchlist(id: string) {
    return this.http.get<Watchlist>(`${this.base}/watchlist/${id}`, { 
      withCredentials: true 
    });
  }

  createWatchlist(payload: WatchlistCreate) {
    return this.http.post<Watchlist>(`${this.base}/watchlist`, payload, { 
      withCredentials: true 
    });
  }

  updateWatchlist(id: string, patch: WatchlistUpdate) {
    return this.http.put<Watchlist>(`${this.base}/watchlist/${id}`, patch, { 
      withCredentials: true 
    });
  }

  deleteWatchlist(id: string) {
    return this.http.delete<void>(`${this.base}/watchlist/${id}`, { 
      withCredentials: true 
    });
  }
}