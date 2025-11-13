// src/app/core/services/profiles.service.ts
import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';
import type {
  Profile,
  ProfileList,
  ProfileCreate,
  ProfileUpdate,
  ProfileCreateMe,
} from '../../models/profile.model';

interface QueryParams {
  user_id?: string | null;
  q?: string | null;
  limit?: number;
  offset?: number;
}

function nullIfEmpty(v: string | null | undefined): string | null | undefined {
  if (v === '') return null;
  return v;
}

const STORAGE_KEY = 'active_profile_id';

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  // ---------- Reactive state ----------
  readonly profileEpoch = signal(0);
  readonly profiles = signal<ProfileList[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly loadedOnce = signal<boolean>(false);
  readonly hasLoadedOnce = computed(() => this.loadedOnce());

  // Active profile signals
  private _activeId = signal<string | null>(null);
  /** Current active profile id (or null) */
  readonly activeId = computed(() => this._activeId());
  /** Current active profile object (or null) */
  readonly active = computed<ProfileList | null>(() => {
    const id = this._activeId();
    return this.profiles().find(p => p.id === id) ?? null;
  });
  /** True if user has >1 profile */
  readonly hasMultiple = computed(() => this.profiles().length > 1);

  constructor() {
    // Restore active profile from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) this._activeId.set(stored);

    // Persist active id
    effect(() => {
      const id = this._activeId();
      if (id) {
        localStorage.setItem(STORAGE_KEY, id);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    });
  }

  reset() {
    this.profiles.set([]);
    this._activeId.set(null);
    this.loadedOnce.set(false);
    this.loading.set(false);
    this.error.set(null);
    localStorage.removeItem(STORAGE_KEY);
  }

  /** Reconcilia la selección activa dado un nuevo listado */
  private reconcileActive(rows: ProfileList[]) {
    const current = this._activeId();
    if (!rows.length) {
      this._activeId.set(null);
      return;
    }
    if (!current || !rows.some(p => p.id === current)) {
      this._activeId.set(rows[0].id); // pick first as default
    }
  }

  /** Load current user's profiles and reconcile the active one */
  loadMyProfiles(force = false): void {
    if (!force && (this.loading() || this.loadedOnce())) return;

    this.loading.set(true);
    this.error.set(null);

    this.http
      .get<ProfileList[]>(`${this.base}/me/profiles`, { withCredentials: true })
      .subscribe({
        next: (rows) => {
          this.profiles.set(rows ?? []);
          this.reconcileActive(rows ?? []);
          this.loadedOnce.set(true);
          this.loading.set(false);
          this.profileEpoch.update(n => n + 1);
        },
        error: (err) => {
          console.error('Failed to load profiles', err);
          this.profiles.set([]);
          this.error.set('Failed to load profiles');
          this.loading.set(false);
          this.profileEpoch.update(n => n + 1);
        },
      });
  }

  /** Manually set active profile (must exist in profiles()) */
  setActiveProfile(id: string) {
    if (this.profiles().some(p => p.id === id)) {
      this._activeId.set(id);
      this.profileEpoch.update(n => n + 1);
    }
  }

  clearActiveProfile() {
    this._activeId.set(null);
    this.profileEpoch.update(n => n + 1);
  }

  // ---------- Admin endpoints ----------
  getProfiles(params: QueryParams): Observable<ProfileList[]> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const value = params[key as keyof QueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<ProfileList[]>(`${this.base}/profiles`, {
      params: httpParams,
      withCredentials: true,
    });
  }

  getProfile(id: string): Observable<Profile> {
    return this.http.get<Profile>(`${this.base}/profiles/${id}`, {
      withCredentials: true,
    });
  }

  createProfile(payload: ProfileCreate): Observable<Profile> {
    const body: ProfileCreate = {
      ...payload,
      avatar: nullIfEmpty(payload.avatar ?? null) ?? null,
      maturity_rating: nullIfEmpty(payload.maturity_rating ?? null) ?? null,
    };
    return this.http.post<Profile>(`${this.base}/profiles`, body, {
      withCredentials: true,
    }).pipe(
      tap(() => this.loadMyProfiles(true))
    );
  }

  updateProfile(id: string, patch: ProfileUpdate): Observable<Profile> {
    const body: ProfileUpdate = {
      ...patch,
      avatar: patch.avatar === '' ? null : patch.avatar,
      maturity_rating: patch.maturity_rating === '' ? null : patch.maturity_rating,
    };
    return this.http.put<Profile>(`${this.base}/profiles/${id}`, body, {
      withCredentials: true,
    }).pipe(
      tap(() => this.loadMyProfiles(true))
    );
  }

  deleteProfile(id: string): Observable<void> {
    const wasActive = this._activeId() === id;
    return this.http.delete<void>(`${this.base}/profiles/${id}`, {
      withCredentials: true,
    }).pipe(
      tap(() => {
        if (wasActive) this._activeId.set(null);
        this.loadMyProfiles(true);
      })
    );
  }

  // ---------- "Me" endpoints" centralizados con sincronización ----------
  getMyProfiles(): Observable<ProfileList[]> {
    // Si lo sigues usando en algún sitio, mejor que no lo uses para recargar UI.
    // Usa loadMyProfiles(). Esto solo retorna el array bruto.
    return this.http.get<ProfileList[]>(`${this.base}/me/profiles`, {
      withCredentials: true,
    });
  }

  createMyProfile(payload: ProfileCreateMe): Observable<Profile> {
    const body: ProfileCreateMe = {
      ...payload,
      avatar: nullIfEmpty(payload.avatar ?? null) ?? null,
      maturity_rating: nullIfEmpty(payload.maturity_rating ?? null) ?? null,
    };
    return this.http.post<Profile>(`${this.base}/me/profiles`, body, {
      withCredentials: true,
    }).pipe(
      tap((created) => {
        // Si no había activo, usar el recién creado
        if (!this._activeId()) this._activeId.set(created.id);
        this.loadMyProfiles(true);
      })
    );
  }

  updateMyProfile(id: string, patch: ProfileUpdate): Observable<Profile> {
    const body: ProfileUpdate = {
      ...patch,
      avatar: patch.avatar === '' ? null : patch.avatar,
      maturity_rating: patch.maturity_rating === '' ? null : patch.maturity_rating,
    };
    return this.http.put<Profile>(`${this.base}/me/profiles/${id}`, body, {
      withCredentials: true,
    }).pipe(
      tap(() => this.loadMyProfiles(true))
    );
  }

  deleteMyProfile(id: string): Observable<void> {
    const wasActive = this._activeId() === id;
    return this.http.delete<void>(`${this.base}/me/profiles/${id}`, {
      withCredentials: true,
    }).pipe(
      tap(() => {
        if (wasActive) this._activeId.set(null);
        this.loadMyProfiles(true);
      })
    );
  }
}
