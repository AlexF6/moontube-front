// src/app/core/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, UrlTree, CanMatchFn, CanActivateFn } from '@angular/router';
import { AuthService } from '../auth.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

function waitAndDecide(router: Router, auth: AuthService) {
  return toObservable(auth.isLoading).pipe(
    filter(v => v === false),
    take(1),
    map((): boolean | UrlTree => auth.user() ? true : router.createUrlTree(['/']))
  );
}

export const AuthGuardMatch: CanMatchFn = () => {
  const auth = inject(AuthService); const router = inject(Router);
  return waitAndDecide(router, auth);
};

export const AuthGuardActivate: CanActivateFn = () => {
  const auth = inject(AuthService); const router = inject(Router);
  return waitAndDecide(router, auth);
};
