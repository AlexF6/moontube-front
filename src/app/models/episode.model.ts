export interface EpisodeList {
  id: string;
  content_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  duration_seconds: number | null;
  release_date: string | null;
}

export interface Episode extends EpisodeList {
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
  video_url: string | null;
}

export interface EpisodeCreate {
  content_id: string;
  season_number: number;
  episode_number: number;
  title: string;
  duration_seconds?: number | null;
  release_date?: string | null;
  video_url?: string | null;
}

export interface EpisodeUpdate {
  season_number?: number;
  episode_number?: number;
  title?: string;
  duration_seconds?: number | null;
  release_date?: string | null;
  video_url?: string | null;
}
