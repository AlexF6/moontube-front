export type User = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
