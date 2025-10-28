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
  content_title?: string | null;
  episode_title?: string | null;
  profile_name?: string | null;
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