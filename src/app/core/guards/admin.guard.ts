// src/app/core/guards/admin.guard.ts
import { inject } from '@angular/core';
import { Router, UrlTree, CanMatchFn } from '@angular/router';
import { AuthService } from '../auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const AdminGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return toObservable(auth.isLoading).pipe(
    filter(loading => loading === false),
    take(1),
    map((): boolean | UrlTree => {
      return auth.user()?.is_admin ? true : router.createUrlTree(['/']);
    })
  );
};