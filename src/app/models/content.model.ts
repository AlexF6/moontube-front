// src/app/models/content.model.ts
export interface ContentList {
  id: string;
  title: string;
  type: 'MOVIE' | 'SERIES' | 'VIDEOS'; // Added VIDEOS
  release_year: number;
  age_rating: string;
  genres: string; // Added genres to list view
  duration_minutes?: number; // Added duration
}

export interface Content {
  id: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
  title: string;
  type: 'MOVIE' | 'SERIES' | 'VIDEOS'; // Added VIDEOS
  description: string;
  release_year: number;
  duration_minutes: number;
  age_rating: string;
  genres: string;
  video_url: string; // Added video_url
}

export interface ContentCreate {
  title: string;
  type: 'MOVIE' | 'SERIES' | 'VIDEOS'; // Added VIDEOS
  description: string;
  release_year: number;
  duration_minutes: number;
  age_rating: string;
  genres: string;
  video_url: string; // Added video_url
}

export interface ContentUpdate {
  title?: string;
  type?: 'MOVIE' | 'SERIES' | 'VIDEOS'; // Added VIDEOS
  description?: string;
  release_year?: number;
  duration_minutes?: number;
  age_rating?: string;
  genres?: string;
  video_url?: string; // Added video_url
}