import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

export const AdminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.user()?.is_admin) {
    return true;
  } else {
    return false;
  }
};