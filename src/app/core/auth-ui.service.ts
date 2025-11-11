import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthUiService {
  isLoginOpen    = signal(false);
  isRegisterOpen = signal(false);
  logoutConfirmOpen = signal(false);

  openLogoutConfirm() { this.logoutConfirmOpen.set(true); }
  closeLogoutConfirm() { this.logoutConfirmOpen.set(false); }
  isLogoutConfirmOpen() { return this.logoutConfirmOpen(); }
  openLogin()     { this.isLoginOpen.set(true); }
  closeLogin()    { this.isLoginOpen.set(false); }
  openRegister()  { this.isRegisterOpen.set(true); }
  closeRegister() { this.isRegisterOpen.set(false); }
}
