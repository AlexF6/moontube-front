// src/app/models/profile.model.ts
export interface ProfileList {
  id: string;
  user_id: string;
  name: string;
  avatar: string;
  maturity_rating: string;
}

export interface Profile {
  id: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
  user_id: string;
  name: string;
  avatar: string;
  maturity_rating: string;
}

export interface ProfileCreate {
  user_id: string;
  name: string;
  avatar: string;
  maturity_rating: string;
}

export interface ProfileUpdate {
  name?: string;
  avatar?: string;
  maturity_rating?: string;
}