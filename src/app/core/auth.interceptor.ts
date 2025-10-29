// src/app/core/interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../enviroments/enviroment';

const API_ORIGIN = new URL(environment.apiUrl).origin;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // 1) Don't intercept third-party (YouTube, Vimeo, etc.) or local assets
  try {
    const url = new URL(req.url, window.location.origin);
    if (url.origin !== API_ORIGIN || url.pathname.startsWith('/assets/')) {
      return next(req); // do not modify
    }

    // 2) Public endpoints: without credentials
    if (url.pathname.startsWith('/public/')) {
      return next(req.clone({ withCredentials: false }));
    }

    // 3) Private endpoints: with credentials
    return next(req.clone({ withCredentials: true }));
  } catch {
    // If URL parsing fails, don't risk it: do not modify
    return next(req);
  }
};
