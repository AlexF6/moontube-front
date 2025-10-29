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

  // Helpers
  private buildParams(params: QueryParams) {
    let httpParams = new HttpParams();
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return httpParams;
  }

  // ---------------- Admin ----------------
  getWatchlists(params: QueryParams) {
    const httpParams = this.buildParams(params);
    return this.http.get<WatchlistList[]>(`${this.base}/watchlist`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  getWatchlist(id: string) {
    return this.http.get<Watchlist>(`${this.base}/watchlist/${id}`, {
      withCredentials: true,
    });
  }

  createWatchlist(payload: WatchlistCreate) {
    return this.http.post<Watchlist>(`${this.base}/watchlist`, payload, {
      withCredentials: true,
    });
  }

  updateWatchlist(id: string, patch: WatchlistUpdate) {
    return this.http.put<Watchlist>(`${this.base}/watchlist/${id}`, patch, {
      withCredentials: true,
    });
  }

  deleteWatchlist(id: string) {
    return this.http.delete<void>(`${this.base}/watchlist/${id}`, {
      withCredentials: true,
    });
  }

  // ---------------- My (scoped to current user) ----------------
  getMyWatchlists(params: QueryParams) {
    const httpParams = this.buildParams(params);
    return this.http.get<WatchlistList[]>(`${this.base}/me/watchlist`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  getMyWatchlist(id: string) {
    return this.http.get<Watchlist>(`${this.base}/me/watchlist/${id}`, {
      withCredentials: true,
    });
  }

  createMyWatchlist(payload: WatchlistCreate) {
    return this.http.post<Watchlist>(`${this.base}/me/watchlist`, payload, {
      withCredentials: true,
    });
  }

  updateMyWatchlist(id: string, patch: WatchlistUpdate) {
    return this.http.put<Watchlist>(`${this.base}/me/watchlist/${id}`, patch, {
      withCredentials: true,
    });
  }

  deleteMyWatchlist(id: string) {
    return this.http.delete<void>(`${this.base}/me/watchlist/${id}`, {
      withCredentials: true,
    });
  }

  /** Optional: si habilitaste DELETE por par (profile_id, content_id) en /me/watchlist */
  deleteMyByPair(profile_id: string, content_id: string) {
    const params = new HttpParams().set('profile_id', profile_id).set('content_id', content_id);
    return this.http.delete<void>(`${this.base}/me/watchlist`, {
      params,
      withCredentials: true,
    });
  }
}
