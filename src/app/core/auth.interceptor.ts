// src/app/core/interceptors/auth.interceptor.ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../enviroments/enviroment';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { catchError, EMPTY, throwError } from 'rxjs';

const API_ORIGIN = new URL(environment.apiUrl).origin;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 1) No interceptar terceros (YouTube, Vimeo, etc.) ni assets locales
  try {
    const url = new URL(req.url, window.location.origin);
    if (url.origin !== API_ORIGIN || url.pathname.startsWith('/assets/')) {
      return next(req);
    }

    // 2) Endpoints públicos → sin credenciales
    if (url.pathname.startsWith('/public/')) {
      return next(req.clone({ withCredentials: false })).pipe(
        catchError((err: HttpErrorResponse) => {
          if (err.status === 401) {
            auth.forceLogout('/');
            return EMPTY;
          }
          return throwError(() => err);
        })
      );
    }

    // 3) Endpoints privados → con credenciales
    return next(req.clone({ withCredentials: true })).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          auth.forceLogout('/'); // limpia estado y navega
          return EMPTY;
        }
        return throwError(() => err);
      })
    );
  } catch {
    // Si falla el parseo de URL, no tocar el request
    return next(req).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          auth.forceLogout('/');
          return EMPTY;
        }
        return throwError(() => err);
      })
    );
  }
};
