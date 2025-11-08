// src/app/core/services/playbacks.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type {
  Playback,
  PlaybackCreate,
  PlaybackUpdate,
  PlaybackListItem,
  MyPlaybackStart,
  MyPlaybackPatch,
} from '../../models/playback.model';

interface QueryParams {
  profile_id?: string | null;
  content_id?: string | null;
  episode_id?: string | null;
  completed?: boolean | null;
  device_q?: string | null;     // admin filter
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
  profile_id?: string | null; 
  completed?: boolean | null;
  device?: string | null;       // /me usa "device"
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

  // helper para construir HttpParams sin enviar null/undefined/''
  private buildParams<T extends Record<string, any>>(obj: T | undefined): HttpParams {
    let params = new HttpParams();
    if (!obj) return params;
    Object.entries(obj).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return params;
  }

  /* ========== Endpoints /me ========== */

  getMyPlaybacks(params: MyPlaybackQueryParams) {
    return this.http.get<PlaybackListItem[]>(
      `${this.base}/me/playbacks`,
      { params: this.buildParams(params), withCredentials: true }
    );
  }

  getMyPlayback(id: string) {
    return this.http.get<Playback>(
      `${this.base}/me/playbacks/${id}`,
      { withCredentials: true }
    );
  }

  deleteMyPlayback(id: string) {
    return this.http.delete<void>(
      `${this.base}/me/playbacks/${id}`,
      { withCredentials: true }
    );
  }

  // POST /me/playbacks/{id}/complete
  markPlaybackCompleted(id: string) {
    return this.http.post<Playback>(
      `${this.base}/me/playbacks/${id}/complete`,
      {},
      { withCredentials: true }
    );
  }

  // POST /me/playbacks/start
  startMyPlayback(payload: MyPlaybackStart) {
    return this.http.post<Playback>(
      `${this.base}/me/playbacks/start`,
      payload,
      { withCredentials: true }
    );
  }

  // PATCH /me/playbacks/{id}
  updateMyPlayback(id: string, patch: MyPlaybackPatch) {
    return this.http.patch<Playback>(
      `${this.base}/me/playbacks/${id}`,
      patch,
      { withCredentials: true }
    );
  }

  /* ========== Endpoints admin ========== */

  getPlaybacks(params: QueryParams) {
    return this.http.get<PlaybackListItem[]>(
      `${this.base}/playbacks`,
      { params: this.buildParams(params), withCredentials: true }
    );
  }

  getPlayback(id: string) {
    return this.http.get<Playback>(
      `${this.base}/playbacks/${id}`,
      { withCredentials: true }
    );
  }

  createPlayback(payload: PlaybackCreate) {
    return this.http.post<Playback>(
      `${this.base}/playbacks`,
      payload,
      { withCredentials: true }
    );
  }

  // En admin tu backend usa PUT /playbacks/{id}
  updatePlayback(id: string, patch: PlaybackUpdate) {
    return this.http.put<Playback>(
      `${this.base}/playbacks/${id}`,
      patch,
      { withCredentials: true }
    );
  }

  deletePlayback(id: string) {
    return this.http.delete<void>(
      `${this.base}/playbacks/${id}`,
      { withCredentials: true }
    );
  }
}
