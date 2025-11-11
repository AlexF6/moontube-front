// src/app/core/session-bootstrap.service.ts
import { Injectable, effect, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { ProfilesService } from './services/profiles.service';

@Injectable({ providedIn: 'root' })
export class SessionBootstrapService {
  private auth = inject(AuthService);
  private profiles = inject(ProfilesService);

  constructor() {
    effect(() => {
      const initialized = this.auth.initialized();
      const user = this.auth.user();
      if (initialized && user && !this.profiles.loading() && !this.profiles.hasLoadedOnce()) {
        this.profiles.loadMyProfiles();
      }
    });
  }
}
