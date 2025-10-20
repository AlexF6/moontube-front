// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

export const AuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Convert the isLoading signal to an observable
  return toObservable(authService.isLoading).pipe(
    // Wait until isLoading is false
    filter(loading => loading === false), 
    // Once loading is done, check the user signal
    map(() => {
      if (authService.user()) {
        return true; // User is logged in, allow access
      } else {
        // User is not logged in, redirect to home
        return router.createUrlTree(['/']); 
      }
    })
  );
};