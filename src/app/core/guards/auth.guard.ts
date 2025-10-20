import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const AuthGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.user()) {
    return true;
  } else {
    return false;
  }
};