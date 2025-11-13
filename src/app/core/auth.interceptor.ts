// src/app/core/interceptors/auth.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

const ORIGIN = window.location.origin;
const API_URL = new URL(environment.apiUrl, ORIGIN);
const API_ORIGIN = API_URL.origin;
const API_BASE_PATH = API_URL.pathname.replace(/\/$/, '');

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  try {
    const reqUrl = new URL(req.url, ORIGIN);

    if (reqUrl.origin !== API_ORIGIN) return next(req);
    if (!reqUrl.pathname.startsWith(API_BASE_PATH)) return next(req);
    if (reqUrl.pathname.startsWith('/assets/')) return next(req);

    const isPublic = reqUrl.pathname.startsWith(`${API_BASE_PATH}/public/`);
    if (isPublic) {
      return next(req.clone({ withCredentials: false }));
    }

    const cloned = req.clone({ withCredentials: true });
    return next(cloned).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          const isAuthMe = reqUrl.pathname === `${API_BASE_PATH}/auth/me`;
          const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
          if (isMutation && !isAuthMe) {
            auth.forceLogout('/');
          }
        }
        return throwError(() => err);
      })
    );
  } catch {
    return next(req);
  }
};
