// src/app/core/services/episodes.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Episode, EpisodeList, EpisodeCreate, EpisodeUpdate } from '../../models/episode.model';
interface QueryParams {
  content_id?: string | null;
  season?: number | null;
  ep?: number | null;
  q_title?: string | null;
  min_duration?: number | null;
  max_duration?: number | null;
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

  getEpisodes(params: QueryParams) {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof QueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<EpisodeList[]>(`${this.base}/episodes`, { 
      params: httpParams,
      withCredentials: true 
    });
  }

  getEpisode(id: string) {
    return this.http.get<Episode>(`${this.base}/episodes/${id}`, { 
      withCredentials: true 
    });
  }

  createEpisode(payload: EpisodeCreate) {
    return this.http.post<Episode>(`${this.base}/episodes`, payload, { 
      withCredentials: true 
    });
  }

  updateEpisode(id: string, patch: EpisodeUpdate) {
    return this.http.put<Episode>(`${this.base}/episodes/${id}`, patch, { 
      withCredentials: true 
    });
  }

  deleteEpisode(id: string) {
    return this.http.delete<void>(`${this.base}/episodes/${id}`, { 
      withCredentials: true 
    });
  }
}