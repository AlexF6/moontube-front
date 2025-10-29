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

export type UserAdminCreate = {
  name: string;
  email: string;
  password: string;
  is_admin: boolean;
  active: boolean;
};

export type UserAdminUpdate = {
  name?: string;
  email?: string;
  active?: boolean;
  is_admin?: boolean;
};

export type UserMeUpdate = {
  name?: string;
  email?: string;
};

export type PasswordChange = {
  current_password: string;
  new_password: string;
};
