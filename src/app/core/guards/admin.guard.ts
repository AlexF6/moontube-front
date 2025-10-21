// src/app/core/guards/admin.guard.ts
import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

export const AdminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isLoading).pipe(
    filter(loading => loading === false),
    map(() => {
      if (authService.user()?.is_admin) {
        return true;
      } else {
        return router.createUrlTree(['/']);
      }
    })
  );
};