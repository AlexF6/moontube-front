// src/app/models/watchlist.model.ts
export interface WatchlistList {
  id: string;
  profile_id: string;
  content_id: string;
  added_at: string;
}

export interface Watchlist {
  id: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
  profile_id: string;
  content_id: string;
  added_at: string;
}

export interface WatchlistCreate {
  profile_id: string;
  content_id: string;
}

export interface WatchlistUpdate {
  profile_id?: string;
  content_id?: string;
}