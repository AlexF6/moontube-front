export type ContentType = 'MOVIE' | 'SERIES';

export type Content = {
  id: string;
  title: string;
  type: ContentType;
  description: string;
  release_year: number;
  duration_minutes: number;
  age_rating: string;
  genres: string | string[];
  created_at: string;
  updated_at: string;
};