export interface ContentList {
  id: string;
  title: string;
  type: 'MOVIE' | 'SERIES' | 'VIDEOS';
  release_year?: number;
  age_rating?: string;
  genres?: string;
  duration_seconds?: number;
  thumbnail?: string;
}

export interface Content {
  id: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
  title: string;
  type: 'MOVIE' | 'SERIES' | 'VIDEOS';
  description: string | null;          // can be null from API
  release_year: number | null;
  duration_seconds: number | null;
  age_rating: string | null;
  genres: string | null;
  video_url: string | null;
  thumbnail?: string;
}

export interface ContentCreate {
  title: string;
  type: 'MOVIE' | 'SERIES' | 'VIDEOS';
  description?: string;
  release_year?: number;
  duration_seconds?: number;
  age_rating?: string;
  genres?: string;
  video_url?: string;
  thumbnail?: string;                  // ready to send
}

export interface ContentUpdate {
  title?: string;
  type?: 'MOVIE' | 'SERIES' | 'VIDEOS';
  description?: string;
  release_year?: number;
  duration_seconds?: number;
  age_rating?: string;
  genres?: string;
  video_url?: string;
  thumbnail?: string;                  // include in updates too
}
