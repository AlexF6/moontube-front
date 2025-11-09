// src/app/core/auth.service.ts
import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../enviroments/enviroment';
import { tap, catchError, of, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

type User = {
  id: string; name: string; email: string;
  active: boolean; is_admin: boolean;
  created_at?: string; updated_at?: string; deleted_at?: string | null;
};

type RegisterDto = { name: string; email: string; password: string; active?: boolean; is_admin?: boolean };
type LoginDto = { email: string; password: string };
type LoginResponse = { message: string };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = environment.apiUrl;
  initialized = computed(() => !this.isLoading());
  user = signal<User | null>(null);
  isLoading = signal(true);
  private _bootstrapped = false;

  constructor(private http: HttpClient, private router: Router) {}

  /** Llamado por APP_INITIALIZER. Resuelve cuando /auth/me finaliza (éxito o error). */
  async bootstrap(): Promise<void> {
    if (this._bootstrapped) return;
    this._bootstrapped = true;
    try {
      const me = await firstValueFrom(this.me());
      this.user.set(me);
    } catch {
      this.user.set(null);
    } finally {
      this.isLoading.set(false);
    }
  }

  register(dto: RegisterDto) {
    return this.http.post<User>(`${this.base}/auth/register`, dto);
  }

  login(dto: LoginDto) {
    this.isLoading.set(true);
    const body = new URLSearchParams({ username: dto.email, password: dto.password }).toString();
    return this.http.post<LoginResponse>(
      `${this.base}/auth/token`,
      body,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, withCredentials: true }
    ).pipe(
      tap(() => this.fetchUser())
    );
  }

  setSession() { this.fetchUser(); }

  private fetchUser() {
    this.me().subscribe({
      next: (user) => { this.user.set(user); this.isLoading.set(false); },
      error: () =>   { this.user.set(null);  this.isLoading.set(false); }
    });
  }

  logout() {
    return this.http.post<{message: string}>(`${this.base}/auth/logout`, {}, { withCredentials: true }).pipe(
      tap(() => this.clearLocalSession()),
      catchError((error) => { this.clearLocalSession(); return of(error); })
    );
  }

  forceLogout(redirectTo: string = '/login') {
    this.clearLocalSession();
    this.router.navigateByUrl(redirectTo);
  }

  private clearLocalSession() {
    this.user.set(null);
    this.isLoading.set(false);
    localStorage.removeItem('active_profile_id');
  }

  me() {
    return this.http.get<User>(`${this.base}/auth/me`, { withCredentials: true });
  }
}
