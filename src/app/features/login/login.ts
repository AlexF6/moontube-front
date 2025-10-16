import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { AuthUiService } from '../../core/auth-ui.service';
import { AuthService } from '../../core/auth.service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
})
export class Login {
  @ViewChild('emailInput') emailInput!: ElementRef<HTMLInputElement>;
  form: FormGroup;
  private auth = inject(AuthService);
  private router = inject(Router);

  errorMsg = '';

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
  onEsc() { 
    this.authUi.closeLogin(); 
  }

  submit() {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMsg = '';
    const { identifier, password } = this.form.value;

    this.auth.login({ email: identifier, password }).subscribe({
      next: (resp) => {
        this.auth.setSession(resp);
        this.authUi.closeLogin();
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.errorMsg = err?.error?.detail ?? 'Invalid credentials';
        this.auth.isLoading.set(false);
      },
    });
  }
}