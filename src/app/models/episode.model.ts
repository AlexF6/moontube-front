// src/app/models/episode.model.ts
export interface EpisodeList {
  id: string;
  content_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  duration_minutes: number;
  release_date: string;
}

export interface Episode {
  id: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
  content_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  duration_minutes: number;
  release_date: string;
  video_url: string;
}

export interface EpisodeCreate {
  content_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  duration_minutes: number;
  release_date: string;
  video_url: string;
}

export interface EpisodeUpdate {
  season_number?: number;
  episode_number?: number;
  title?: string;
  duration_minutes?: number;
  release_date?: string;
  video_url?: string;
}