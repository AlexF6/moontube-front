// src/app/models/playback.model.ts
export interface PlaybackList {
  id: string;
  profile_id: string;
  content_id: string;
  episode_id: string;
  started_at: string;
  ended_at: string;
  progress_seconds: number;
  completed: boolean;
  device: string;
}

export interface Playback {
  id: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
  profile_id: string;
  content_id: string;
  episode_id: string;
  started_at: string;
  ended_at: string;
  progress_seconds: number;
  completed: boolean;
  device: string;
}

export interface PlaybackCreate {
  profile_id: string;
  content_id: string;
  episode_id: string;
  started_at: string;
  ended_at: string;
  progress_seconds: number;
  completed: boolean;
  device: string;
}

export interface PlaybackUpdate {
  ended_at?: string;
  progress_seconds?: number;
  completed?: boolean;
  device?: string;
}