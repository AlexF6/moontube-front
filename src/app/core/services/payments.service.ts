import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../enviroments/enviroment';
import type { Payment } from '../../models/payment.model';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private http = inject(HttpClient);
  private base = environment.apiUrl;

  list() { return this.http.get<Payment[]>(`${this.base}/payments`, { withCredentials: true }); }
}