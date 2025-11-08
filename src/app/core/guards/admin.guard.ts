// src/app/core/guards/admin.guard.ts
import { inject } from '@angular/core';
import { Router, UrlTree, CanMatchFn } from '@angular/router';
import { AuthService } from '../auth.service';

/** Requiere usuario y flag is_admin; si no, redirige al home público */
export const AdminGuard: CanMatchFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoading()) return false;

  return auth.user()?.is_admin ? true : router.createUrlTree(['/']);
};
