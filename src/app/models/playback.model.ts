// src/app/models/playback.model.ts
export interface PlaybackListItem {
  id: string;
  profile_id: string;
  content_id: string;
  episode_id?: string | null;
  started_at?: string | null;
  ended_at?: string | null;
  progress_seconds: number;
  completed: boolean;
  device?: string | null;

  // optional denormalized fields (if your API later includes them)
  content_title?: string | null;
  episode_title?: string | null;
  profile_name?: string | null;
}

// Full entity read
export interface Playback {
  id: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;

  profile_id: string;
  content_id: string;
  episode_id?: string | null;

  started_at: string;           // server sets if not supplied
  ended_at?: string | null;

  progress_seconds: number;
  completed: boolean;
  device?: string | null;
}

// Create payload (match backend: most fields optional, server normalizes)
export interface PlaybackCreate {
  profile_id: string;
  content_id: string;
  episode_id?: string | null;
  started_at?: string;          // optional; server default now()
  ended_at?: string | null;
  progress_seconds?: number;    // optional; default 0
  completed?: boolean;          // optional; default false
  device?: string | null;
}

// Update payload
export interface PlaybackUpdate {
  ended_at?: string | null;
  progress_seconds?: number;
  completed?: boolean;
  device?: string | null;
}
