import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthUiService } from '../../core/auth-ui.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
})
export class Login {
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLInputElement>;
  form: FormGroup;

  constructor(private fb: FormBuilder, public authUi: AuthUiService) {
    this.form = this.fb.group({
      identifier: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  ngAfterViewInit() {
    queueMicrotask(() => this.emailInput?.nativeElement?.focus());
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.authUi.closeLogin(); }

  submit() {
    if (this.form.valid) {
      console.log('Login data:', this.form.value);
      this.authUi.closeLogin();
    } else {
      this.form.markAllAsTouched();
    }
  }

  loginWithGoogle() {
    console.log('Google sign-in');
  }
}
