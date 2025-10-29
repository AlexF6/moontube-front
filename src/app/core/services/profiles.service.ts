import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import { Observable } from 'rxjs';
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

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

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
    });
  }

  updateProfile(id: string, patch: ProfileUpdate): Observable<Profile> {
    const body: ProfileUpdate = {
      ...patch,
      avatar: patch.avatar === '' ? null : patch.avatar,
      maturity_rating: patch.maturity_rating === '' ? null : patch.maturity_rating,
    };
    return this.http.put<Profile>(`${this.base}/profiles/${id}`, body, {
      withCredentials: true,
    });
  }

  deleteProfile(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/profiles/${id}`, {
      withCredentials: true,
    });
  }

  getMyProfiles(): Observable<ProfileList[]> {
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
    });
  }

  updateMyProfile(id: string, patch: ProfileUpdate): Observable<Profile> {
    const body: ProfileUpdate = {
      ...patch,
      avatar: patch.avatar === '' ? null : patch.avatar,
      maturity_rating: patch.maturity_rating === '' ? null : patch.maturity_rating,
    };
    return this.http.put<Profile>(`${this.base}/me/profiles/${id}`, body, {
      withCredentials: true,
    });
  }

  deleteMyProfile(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/me/profiles/${id}`, {
      withCredentials: true,
    });
  }
}
