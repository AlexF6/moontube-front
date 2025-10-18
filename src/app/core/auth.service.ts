import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../enviroments/enviroment';
import { tap, catchError, of } from 'rxjs';

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

// Updated: Login response now only contains message, no token
type LoginResponse = {
  message: string;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;
  user = signal<User | null>(null);
  isLoading = signal(false);

  constructor(private http: HttpClient) {
    this.checkAuthStatus();
  }

  register(dto: RegisterDto) {
    return this.http.post<User>(`${this.base}/auth/register`, dto);
  }

  login(dto: LoginDto) {
    this.isLoading.set(true);

    const body = new URLSearchParams({
      username: dto.email,
      password: dto.password,
    }).toString();

    return this.http.post<LoginResponse>(
      `${this.base}/auth/token`,
      body,
      { 
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        withCredentials: true // Important for cookies
      }
    ).pipe(
      tap(() => {
        // On successful login, fetch user data
        this.fetchUser();
      })
    );
  }

  setSession() {
    // Since token is in cookie, we just need to fetch user data
    this.fetchUser();
  }

  private fetchUser() {
    this.me().subscribe({
      next: (user) => {
        this.user.set(user);
        this.isLoading.set(false);
      },
      error: () => {
        this.user.set(null);
        this.isLoading.set(false);
      }
    });
  }

  private checkAuthStatus() {
    this.me().subscribe({
      next: (user) => this.user.set(user),
      error: () => this.user.set(null)
    });
  }

  logout() {
    return this.http.post<{message: string}>(`${this.base}/auth/logout`, {}, { 
      withCredentials: true 
    }).pipe(
      tap(() => {
        this.clearLocalSession();
      }),
      catchError((error) => {
        this.clearLocalSession();
        return of(error);
      })
    );
  }

  private clearLocalSession() {
    this.user.set(null);
  }

  me() {
    return this.http.get<User>(`${this.base}/auth/me`, {
      withCredentials: true
    });
  }
}