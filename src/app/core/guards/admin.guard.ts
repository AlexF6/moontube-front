// src/app/core/guards/admin.guard.ts
import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

export const AdminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Convert the isLoading signal to an observable
  return toObservable(authService.isLoading).pipe(
    // Wait until isLoading is false
    filter(loading => loading === false),
    // Once loading is done, check the user signal
    map(() => {
      // The AuthGuard should have already run, but we check again
      // for safety and to check the is_admin flag.
      if (authService.user()?.is_admin) {
        return true; // User is admin, allow access
      } else {
        // User is not admin (or not logged in), redirect to home
        return router.createUrlTree(['/']);
      }
    })
  );
};