import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Watchlist, WatchlistList, WatchlistCreate, WatchlistUpdate } from '../../models/watchlist.model';
import { map, switchMap, of } from 'rxjs';

interface QueryParams {
  profile_id?: string | null;
  content_id?: string | null;
  added_from?: string | null;
  added_to?: string | null;
  limit?: number;
  offset?: number;
}

/** Payload liviano para /me/watchlist (profile_id opcional) */
type MyWatchlistCreate = { content_id: string; profile_id?: string | null };

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

  /** Nota: para /me usamos profile_id opcional (el backend resuelve si hay 1 perfil). */
  createMyWatchlist(payload: MyWatchlistCreate) {
    return this.http.post<Watchlist>(`${this.base}/me/watchlist`, payload, {
      withCredentials: true,
    });
  }

  // updateMyWatchlist(id: string, patch: WatchlistUpdate) {
  //   return this.http.put<Watchlist>(`${this.base}/me/watchlist/${id}`, patch, {
  //     withCredentials: true,
  //   });
  // }

  deleteMyWatchlist(id: string) {
    return this.http.delete<void>(`${this.base}/me/watchlist/${id}`, {
      withCredentials: true,
    });
  }

  /** Si habilitaste DELETE por par (profile_id, content_id) en /me/watchlist */
  deleteMyByPair(profile_id: string, content_id: string) {
    const params = new HttpParams().set('profile_id', profile_id).set('content_id', content_id);
    return this.http.delete<void>(`${this.base}/me/watchlist`, {
      params,
      withCredentials: true,
    });
  }

  /** Devuelve true si el contenido ya está en la watchlist (en cualquiera de tus perfiles) */
  contains(contentId: string, profileId?: string) {
    const params: any = { content_id: contentId, limit: 1 };
    if (profileId) params.profile_id = profileId;

    const httpParams = this.buildParams(params);
    return this.http.get<WatchlistList[]>(`${this.base}/me/watchlist`, {
      params: httpParams,
      withCredentials: true,
    }).pipe(map(rows => rows.length > 0));
  }

  /** Opcional: toggle (si no está → agrega; si está → elimina)
   *  Si el usuario tiene >1 perfil, debes pasar profile_id para el delete.
   */
  toggle(content_id: string, profile_id?: string | null) {
    return this.contains(content_id).pipe(
      switchMap(inList => {
        if (!inList) {
          return this.createMyWatchlist({ content_id, profile_id: profile_id ?? undefined });
        }
        if (!profile_id) {
          // Si no tenemos profile_id y hay múltiples perfiles, el componente debe pedirlo
          return of(null);
        }
        return this.deleteMyByPair(profile_id, content_id);
      })
    );
  }
}
