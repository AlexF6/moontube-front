// src/app/core/services/playbacks.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Playback, PlaybackList, PlaybackCreate, PlaybackUpdate, PlaybackListItem } from '../../models/playback.model';

interface QueryParams {
  profile_id?: string | null;
  content_id?: string | null;
  episode_id?: string | null;
  completed?: boolean | null;
  device_q?: string | null;
  started_from?: string | null;
  started_to?: string | null;
  ended_from?: string | null;
  ended_to?: string | null;
  min_progress?: number | null;
  max_progress?: number | null;
  limit?: number;
  offset?: number;
}

interface MyPlaybackQueryParams {
  completed?: boolean | null;
  device?: string | null;
  content_id?: string | null;
  episode_id?: string | null;
  started_from?: string | null;
  started_to?: string | null;
  ended_from?: string | null;
  ended_to?: string | null;
  min_progress?: number | null;
  max_progress?: number | null;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class PlaybacksService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

    // User-specific endpoints
  getMyPlaybacks(params: MyPlaybackQueryParams) {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof MyPlaybackQueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<PlaybackListItem[]>(`${this.base}/me/playbacks`, { 
      params: httpParams,
      withCredentials: true 
    });
  }

  getMyPlayback(id: string) {
    return this.http.get<Playback>(`${this.base}/me/playbacks/${id}`, { 
      withCredentials: true 
    });
  }

  deleteMyPlayback(id: string) {
    return this.http.delete<void>(`${this.base}/me/playbacks/${id}`, { 
      withCredentials: true 
    });
  }

  markPlaybackCompleted(id: string) {
    return this.http.post<Playback>(`${this.base}/me/playbacks/${id}/complete`, {}, { 
      withCredentials: true 
    });
  }

  getPlaybacks(params: QueryParams) {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof QueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<PlaybackList[]>(`${this.base}/playbacks`, { 
      params: httpParams,
      withCredentials: true 
    });
  }

  getPlayback(id: string) {
    return this.http.get<Playback>(`${this.base}/playbacks/${id}`, { 
      withCredentials: true 
    });
  }

  createPlayback(payload: PlaybackCreate) {
    return this.http.post<Playback>(`${this.base}/playbacks`, payload, { 
      withCredentials: true 
    });
  }

  updatePlayback(id: string, patch: PlaybackUpdate) {
    return this.http.put<Playback>(`${this.base}/playbacks/${id}`, patch, { 
      withCredentials: true 
    });
  }

  deletePlayback(id: string) {
    return this.http.delete<void>(`${this.base}/playbacks/${id}`, { 
      withCredentials: true 
    });
  }
}