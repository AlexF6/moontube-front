// src/app/core/interceptors/auth.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

// ✅ Normalización robusta para /api o URLs absolutas
const ORIGIN = window.location.origin;
const API_URL = new URL(environment.apiUrl, ORIGIN);   // e.g. '/api' -> 'http://localhost:4200/api'
const API_ORIGIN = API_URL.origin;                     // 'http://localhost:4200'
const API_BASE_PATH = API_URL.pathname.replace(/\/$/, ''); // '/api' (sin slash final)

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  try {
    const reqUrl = new URL(req.url, ORIGIN);

    // 1) Ignorar terceros y assets locales
    if (reqUrl.origin !== API_ORIGIN) return next(req);
    if (!reqUrl.pathname.startsWith(API_BASE_PATH)) return next(req); // no es contra la API
    if (reqUrl.pathname.startsWith('/assets/')) return next(req);

    // 2) Públicos (p. ej. /api/public/...) → sin credenciales
    const isPublic = reqUrl.pathname.startsWith(`${API_BASE_PATH}/public/`);
    if (isPublic) {
      return next(req.clone({ withCredentials: false }));
    }

    // 3) Privados → con credenciales
    const cloned = req.clone({ withCredentials: true });
    return next(cloned).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          // No forzar logout por GET /auth/me; deja que AuthService lo maneje
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
    // Si falla el parseo, no tocar la request
    return next(req);
  }
};
