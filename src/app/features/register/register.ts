import { Component, ElementRef, HostListener, ViewChild, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors, FormControl } from '@angular/forms';
import { AuthUiService } from '../../core/auth-ui.service';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const p = group.get('password')?.value;
  const c = group.get('confirm')?.value;
  return p && c && p !== c ? { mismatch: true } : null;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.html',
})
export class Register {
  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;
  form: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';

  private auth = inject(AuthService);
  private router = inject(Router);

  constructor(private fb: FormBuilder, public authUi: AuthUiService) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      passwords: this.fb.group({
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirm: ['', [Validators.required]],
      }, { validators: matchPasswords })
    });
  }

  ngAfterViewInit() {
    queueMicrotask(() => this.nameInput?.nativeElement?.focus());
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.authUi.closeRegister(); }

  get pwGroup() { return this.form.get('passwords') as FormGroup; }
  
  get passwordControl() {
    return this.pwGroup.get('password') as FormControl;
  }

  get confirmControl() {
    return this.pwGroup.get('confirm') as FormControl;
  }
  
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    this.successMsg = '';

    const { name, email } = this.form.value;
    const { password } = this.pwGroup.value;

    // Call the actual AuthService register method
    this.auth.register({ name, email, password }).subscribe({
      next: (user) => {
        this.successMsg = 'Account created successfully! Logging you in...';
        
        // Auto-login after successful registration
        this.auth.login({ email, password }).subscribe({
          next: () => {
            // Login successful - user data will be set automatically via the service
            this.loading = false;
            this.authUi.closeRegister();
            this.router.navigate(['/']);
          },
          error: (loginErr) => {
            this.loading = false;
            // If auto-login fails, redirect to login
            this.successMsg = 'Account created! Please login to continue.';
            setTimeout(() => {
              this.authUi.closeRegister();
              this.authUi.openLogin();
            }, 2000);
          }
        });
      },
      error: (err) => {
        this.loading = false;
        
        // Handle specific errors from your backend
        if (err.status === 400) {
          if (err.error?.detail?.includes('Email already registered')) {
            this.errorMsg = 'This email is already registered. Please use a different email or login.';
            this.form.get('email')?.setErrors({ 'emailTaken': true });
          } else {
            this.errorMsg = err.error?.detail ?? 'Invalid registration data. Please check your information.';
          }
        } else if (err.status === 0) {
          this.errorMsg = 'Network error. Please check your connection.';
        } else {
          this.errorMsg = err.error?.detail ?? err.error?.message ?? 'Registration failed. Please try again.';
        }

        // Clear password fields on error
        this.pwGroup.reset();
        
        // Focus back to name input
        setTimeout(() => this.nameInput?.nativeElement?.focus(), 100);
      },
    });
  }

  hasError(controlName: string, errorType: string): boolean {
    const control = this.form.get(controlName);
    return !!(control?.touched && control?.hasError(errorType));
  }

  hasGroupError(groupName: string, errorType: string): boolean {
    const group = this.form.get(groupName);
    return !!(group?.touched && group?.hasError(errorType));
  }
}