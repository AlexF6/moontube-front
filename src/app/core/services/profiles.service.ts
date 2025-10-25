// src/app/core/services/profiles.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Profile, ProfileList, ProfileCreate, ProfileUpdate } from '../../models/profile.model';

interface QueryParams {
  user_id?: string | null;
  q?: string | null;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  getProfiles(params: QueryParams) {
    let httpParams = new HttpParams();
    
    Object.keys(params).forEach(key => {
      const value = params[key as keyof QueryParams];
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, value.toString());
      }
    });

    return this.http.get<ProfileList[]>(`${this.base}/profiles`, { 
      params: httpParams,
      withCredentials: true 
    });
  }

  getProfile(id: string) {
    return this.http.get<Profile>(`${this.base}/profiles/${id}`, { 
      withCredentials: true 
    });
  }

  createProfile(payload: ProfileCreate) {
    return this.http.post<Profile>(`${this.base}/profiles`, payload, { 
      withCredentials: true 
    });
  }

  updateProfile(id: string, patch: ProfileUpdate) {
    return this.http.put<Profile>(`${this.base}/profiles/${id}`, patch, { 
      withCredentials: true 
    });
  }

  deleteProfile(id: string) {
    return this.http.delete<void>(`${this.base}/profiles/${id}`, { 
      withCredentials: true 
    });
  }
}