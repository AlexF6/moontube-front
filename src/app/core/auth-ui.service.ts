import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthUiService {
  isLoginOpen    = signal(false);
  isRegisterOpen = signal(false);

  openLogin()     { this.isLoginOpen.set(true); }
  closeLogin()    { this.isLoginOpen.set(false); }
  openRegister()  { this.isRegisterOpen.set(true); }
  closeRegister() { this.isRegisterOpen.set(false); }
}
