import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import type { Episode, EpisodeList, EpisodeCreate, EpisodeUpdate } from '../../models/episode.model';

interface QueryParams {
  content_id?: string | null;
  season?: number | null;
  ep?: number | null;
  q_title?: string | null;
  min_duration?: number | null; // seconds
  max_duration?: number | null; // seconds
  year_from?: number | null;
  year_to?: number | null;
  order_by?: 'season' | 'episode' | 'title' | 'created_at' | 'release_date';
  order_dir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class EpisodesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ---------------------------------------------
  // Helpers
  // ---------------------------------------------
  private buildParams(obj: Record<string, unknown>) {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(obj)) {
      if (v !== null && v !== undefined && v !== '') {
        params = params.set(k, String(v));
      }
    }
    return params;
  }

  // ---------------------------------------------
  // ADMIN (CRUD)  ->  /episodes
  // Mantengo los nombres existentes
  // ---------------------------------------------
  getEpisodes(params: QueryParams) {
    const httpParams = this.buildParams(params as Record<string, unknown>);
    return this.http.get<EpisodeList[]>(`${this.base}/episodes`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  getEpisode(id: string) {
    return this.http.get<Episode>(`${this.base}/episodes/${id}`, {
      withCredentials: true,
    });
  }

  createEpisode(payload: EpisodeCreate) {
    return this.http.post<Episode>(`${this.base}/episodes`, payload, {
      withCredentials: true,
    });
  }

  updateEpisode(id: string, patch: EpisodeUpdate) {
    return this.http.put<Episode>(`${this.base}/episodes/${id}`, patch, {
      withCredentials: true,
    });
  }

  deleteEpisode(id: string) {
    return this.http.delete<void>(`${this.base}/episodes/${id}`, {
      withCredentials: true,
    });
  }

  // ---------------------------------------------
  // USUARIO (READ-ONLY)  ->  /me/...
  // Nuevos métodos, sin romper nada existente
  // ---------------------------------------------

  /** Lista episodios visibles para el usuario autenticado: GET /me/episodes */
  getMyEpisodes(params: QueryParams) {
    const httpParams = this.buildParams(params as Record<string, unknown>);
    return this.http.get<EpisodeList[]>(`${this.base}/me/episodes`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  /** Obtiene un episodio (opcionalmente con video_url): GET /me/episodes/{id}?include_video=... */
  getMyEpisode(id: string, includeVideo = false) {
    const httpParams = this.buildParams({ include_video: includeVideo });
    return this.http.get<Episode>(`${this.base}/me/episodes/${id}`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  /** Lista episodios por contenido: GET /me/contents/{content_id}/episodes */
  getMyEpisodesByContent(contentId: string, params: Omit<QueryParams, 'content_id'> = {}) {
    const httpParams = this.buildParams(params as Record<string, unknown>);
    return this.http.get<EpisodeList[]>(
      `${this.base}/me/contents/${contentId}/episodes`,
      { params: httpParams, withCredentials: true }
    );
  }
}
