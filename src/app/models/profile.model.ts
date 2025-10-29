export interface ProfileList {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;           // nullable en backend
  maturity_rating: string | null;  // nullable en backend
}

export interface Profile {
  id: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string | null;
  user_id: string;
  name: string;
  avatar: string | null;           // nullable
  maturity_rating: string | null;  // nullable
}

export interface ProfileCreate {
  user_id: string;
  name: string;
  avatar: string | null;           // permitir null
  maturity_rating: string | null;  // permitir null
}

export interface ProfileCreateMe {
  name: string;
  avatar: string | null;
  maturity_rating: string | null;
}

export interface ProfileUpdate {
  name?: string;
  avatar?: string | null;
  maturity_rating?: string | null;
}
