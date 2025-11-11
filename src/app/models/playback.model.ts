// src/app/models/playback.model.ts

// Items para listados (GET /me/playbacks y /playbacks)
export interface PlaybackListItem {
  id: string;
  profile_id: string;
  content_id: string;
  episode_id?: string | null;
  started_at: string;                  // en backend es requerido
  ended_at?: string | null;
  progress_seconds: number;
  duration_seconds?: number | null;    // puede ser null
  completed: boolean;
  device?: string | null;
  last_seen_at?: string | null;        // puede no venir

  // denormalizados (si en el futuro los expone el API)
  content_title?: string | null;
  episode_title?: string | null;
  profile_name?: string | null;
}

// Entidad completa (GET /playbacks/{id} y /me/playbacks/{id})
export interface Playback {
  id: string;

  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;

  profile_id: string;
  content_id: string;
  episode_id?: string | null;

  started_at: string;
  ended_at?: string | null;

  progress_seconds: number;
  duration_seconds?: number | null;
  completed: boolean;
  device?: string | null;
  last_seen_at?: string | null;
}

// Admin: create
export interface PlaybackCreate {
  profile_id: string;
  content_id: string;
  episode_id?: string | null;
  started_at?: string;           // server default = now
  ended_at?: string | null;
  progress_seconds?: number;     // default 0
  completed?: boolean;           // default false
  device?: string | null;
}

// Admin: update (PUT /playbacks/{id})
export interface PlaybackUpdate {
  ended_at?: string | null;
  progress_seconds?: number;
  completed?: boolean;
  device?: string | null;
}

/* -------- Endpoints /me -------- */

// POST /me/playbacks/start
export interface MyPlaybackStart {
  profile_id: string;
  content_id?: string | null;
  episode_id?: string | null;
  device?: string | null; // se trunca a 200 en backend
}

// PATCH /me/playbacks/{id}
export interface MyPlaybackPatch {
  progress_seconds: number;
  duration_seconds?: number | null;
  completed?: boolean | null;
}
