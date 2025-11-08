// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, UrlTree, CanMatchFn } from '@angular/router';
import { AuthService } from '../auth.service';

export const AuthGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoading()) return false;

  return auth.user() ? true : router.createUrlTree(['/']);
};
