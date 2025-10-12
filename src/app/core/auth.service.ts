import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroment/enviroment';

type User = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

type RegisterDto = {
  name: string;
  email: string;
  password: string;
  active?: boolean;
  is_admin?: boolean;
};

type LoginDto = {
  email: string;
  password: string;
};

type LoginResponse =
  | { access_token: string; token_type?: string; user?: User }
  | User;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;
  user = signal<User | null>(null);
  isLoading = signal(false);

  constructor(private http: HttpClient) {}

  register(dto: RegisterDto) {
    return this.http.post<User>(`${this.base}/users`, {
      active: true,
      is_admin: false,
      ...dto,
    });
  }

login(dto: { email: string; password: string }) {
  this.isLoading.set(true);

  const body = new URLSearchParams({
    username: dto.email,
    password: dto.password,
  }).toString();

  return this.http.post<LoginResponse>(
    `${this.base}/auth/token`,
    body,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
}
  setSession(resp: LoginResponse) {
    const isTokenShape = (r: any) => typeof r?.access_token === 'string';
    if (isTokenShape(resp)) {
      localStorage.setItem('access_token', (resp as any).access_token);
      if ((resp as any).user) this.user.set((resp as any).user);
    } else {
      this.user.set(resp as User);
    }
  }

  logout() {
    localStorage.removeItem('access_token');
    this.user.set(null);
  }

  me() {
    return this.http.get<User>(`${this.base}/auth/me`);
  }

  get token(): string | null {
    return localStorage.getItem('access_token');
  }
}